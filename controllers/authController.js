const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) => {
  return jwt.sign(
    {
      id: id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // sending jwt token as a cookie so that the next time the app makes the call it will always send the jwt token
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // 90days*24hours*60min*60sec*1000milsec*
    ),
    // // in this two ways, browser wont be able to access the cookie
    // secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // to remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1)Check if email and password exist
  if (!email || !password) {
    next(new AppError("Please provide both email and password", 400));
  }

  // 2)If user exists and password is incorrect
  const user = await User.findOne({
    email: email,
  }).select("+password");
  //   here we are accessing the encrypted pass from db to check w the user entered pass

  // put the password matching logic inside the if condition so that is teh user exist only  then the condition will run
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3)If everythings fine send back the jwt token
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  try {
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).status({ status: "success" });
  } catch (err) {
    console.log(err);
  }
};

// Middleware to cross verify JWT token
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log(token);

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Token varificationn
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("User belonged to this token dosent exist", 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User changed password. Please login again.", 401)
    );
  }

  // 5) Grant access to protected route
  req.user = currentUser;
  next();
});

// Middleware to check if the logged guy is either admin or lead-guide
// ...roles gets the value from tourRoute for which the route is permitted
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // role['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

// After clicking on forgotPassword you will receive mail with reset token
// there in the body specify new password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // console.log(user);
  await user.save({ validateBeforeSave: false });

  // 3) Send email to the user
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to : ${resetURL}.\nIf you didn't forgotPassword, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token {valid for 10min}",
      message: message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to mail!",
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sendEmail, please try again later", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for the user
  // step 3 is in userModel
  // 4) Log the user in send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if posted curremt password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your curremt password is incorrect", 401));
  }

  // 3) If yes then update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // we are not using user.update() method coz the validation wont work(check schema) and also the jwt token thing works only on save
  // we didnt use findByIdAndUpdate method as the middleware we created to encrypt pass wont work
  await user.save();

  // 4) Log the user in and send JWT
  createSendToken(user, 200, res);
});
