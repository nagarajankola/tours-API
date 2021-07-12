const multer = require("multer");
const sharp = require("sharp");
const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

// THIS IS TO SAVE IMAGE IN SERVER (NO BUFFER)
// const multerStorage = multer.diskStorage({
// set the destination
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
// set the filename
//   filename: (req, file, cb) => {
//     // user-434rb3i4u2b3-33333131.jpg
//     const extension = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

// THIS MAKE THE FILE INTO BUFFER
const multerStorage = multer.memoryStorage();

// To check if the file uploaded is image only
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload any image", 400), false);
  }
};

// Actual multer
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// To specify that user gonna upload a single photo
exports.uploadUserPhoto = upload.single("photo");

// Resizing and cropping the image
exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  console.log(req.file);
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // gotta use sharp package to crop
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

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
  console.log(req.file);
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
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
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
};

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
