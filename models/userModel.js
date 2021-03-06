const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide valid email"],
  },
  photo: { type: String, default: "default.jpg" },
  role: {
    type: String,
    enum: ["admin", "user", "guide", "lead-guide"],
    default: "user",
    
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
    select: false,
  },
  //   No need to save the confirm pass in DB
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on save OR create
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords dosen't match",
    },
  },
  // this gets changed everytime the user changes the password
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  // Only run the function if password was actually modified, that means when the user updates the email or other details using save method no need to run this function
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12(cpu intensive)
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// After resetting password through token link and stuff we have to change the passwordChangedAt
userSchema.pre("save", function (next) {
  // only run this password hashing when the only password is changed or modified and not when other things in the schema is modified
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// so for all the find methods only the users which are active are used
// so now updating logging in wont work
userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

// This is just a method to check if the password is correct while logging in the user
// Actual functionallity is in authController, here its just the  method
userSchema.methods.correctPassword = async function (
  //   candidate password is password from the db && userpassword is the password just entered by the user
  candidatePassword,
  userPassword
) {
  // candidate password = password which we got from the user
  // user password = actual password in  the db
  return await bcrypt.compare(candidatePassword, userPassword);
};

// To check if the user jas changed the password after issuing the token
// JWTTimestamp gives the time when the token was created and issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // As password changed at is from mongoDB we are changing the timestamp to miliseconds version(coz JWT time will be in miliseconds)
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimestamp,  JWTTimestamp)
    // password will be saved first and later the jwt token will be issued
    // so in that sense JWT<changedTimeStamp means pass was not changed
    return JWTTimestamp < changedTimestamp;
  }
  // false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
