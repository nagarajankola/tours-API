const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide valid email"],
  },
  photo: String,
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
});

userSchema.pre("save", async function (next) {
  // Only run the function if password was actually modified, that means when the user updates the email or other details using save method no need to run this function
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// This is just a method to check if the password is correct while logging in the user
// Actual functionallity is in authController, here its just the  method
userSchema.methods.correctPassword = async function (
  //   candidate password is password from the db && userpassword is the password just entered by the user
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
