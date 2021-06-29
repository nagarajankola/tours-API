const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

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

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
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
  const correct = await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3)If everythings fine send back the jwt token
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

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
    return next(AppError("User belonged to this token dosent exist", 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(AppError("User changed password. Please login again.", 401));
  }

  // 5) Grant access to protected route
  req.user = currentUser;
  next();
});
