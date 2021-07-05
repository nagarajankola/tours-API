const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handleFactory");

// This function gets only the required fields[that is name and email in this case] and just discards the other info
// ...allowedFields get the value of 'name',''email' specified during the function call
const filterObj = (obj, ...allowedFields) => {
  // this new obj is to store the new(required) values after filtering
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();
//   // getting user info except password
//   // SEND RESPONSE
//   res.status(200).json({
//     status: "success",
//     result: users.length,
//     data: {
//       users,
//     },
//   });
// });

// to update the user info by user
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user posts password database,
  // this condition is only to check if user tries to update password through this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for updating password. Please use /updateMyPassword",
        400
      )
    );
  }

  // 2) Update user document
  // function call to filterout unwanted info
  const filteredBody = filterObj(req.body, "name", "email");
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = factory.getOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not to define. Please use /signup instead.",
  });
};

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: "error",
//     message: "This route is yet to define",
//   });
// };
exports.updateUser = factory.updateOne(User);

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: "error",
//     message: "This route is yet to define",
//   });
// };
exports.deleteUser = factory.deleteOne(User);
