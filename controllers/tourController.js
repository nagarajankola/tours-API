const multer = require("multer");
const sharp = require("sharp");
const Tour = require("./../models/tourModel");
// const APIfeatures = require("../utils/APIfeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

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

// IMPORTANT FOR MULTER IMAGE
// if its only a single image AND only one img field in schema
// -- upload.single('photo')       > req.file

// if its multiple images AND only one img field in schema
// -- upload.array('photo', 5)     > req.files

// if its multiple images AND single image AND one and multiple img for diff fields in schema
exports.uploadTourImages = upload.fields([
  //> req.files
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  // if there are no images thn just skip
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // 1) Process cover image [for cover image]
  // gotta use sharp package to crop
  // first make a file name
  const imageCoverFileName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // cropping the cover image, [0] coz it gives data in array even if its  a singel pic
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFileName}`);
  req.body.imageCover = imageCoverFileName;

  // 2) images [many image]
  // declare a variable
  req.body.images = [];
  req.body.imagesInBinary = [];

  // as there are multiple promises it has to be done in this way
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
      req.body.imagesInBinary.push(file)
      // console.log(file);
    })
  );
  next();
});

// Middleware for filtering top 5 tours
exports.aliasTours = async (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// getting all tours from json file
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// route to get all tours
exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // EXECUTE QUERY
//   const features = new APIfeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: "success",
//     result: tours.length,
//     data: {
//       tours,
//     },
//   });
//   // try {
//   // BUILDING QUERY
//   // 1A filtering
//   // const queryObj = {...req.query};

//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // excludedFields.forEach(el => delete queryObj[el]);
//   // // http://localhost:3000/api/v1/tours?duration=5&difficulty=easy&price=1500

//   // // 1B advance filtering
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//   // // http://localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy&price[lt]=1500
//   // console.log(JSON.parse(queryStr));

//   // let query =  Tour.find(JSON.parse(queryStr));

//   //  2) Sorting
//   // http://localhost:3000/api/v1/tours?sort=price,-ratingsAverage
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' '); // This .split(',').join(' ') seperates everything and joins them with space (eg: ['name duration']) coz look at the URL
//   //   console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // }else {
//   //   // http://localhost:3000/api/v1/tours
//   //   query = query.sort('-createdAt');
//   // }

//   //  3) Field limiting
//   // if (req.query.fields) {
//   //   // http://localhost:3000/api/v1/tours?fields=name,duration
//   //   const fields = req.query.fields.split(',').join(' '); // This .split(',').join(' ') seperates everything and joins them with space (eg: ['name duration'])
//   //   query = query.select(fields);
//   // }else{
//   //   query = query.select('-__v');  // if we add "-" it excludes that field & if we dont put it includes
//   // }

//   //  4) Pegination
//   // http://localhost:3000/api/v1/tours?page=1&limit=3
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page-1)*limit;

//   // query = query.skip(skip).limit(limit);

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if(skip >= numTours)
//   //    throw new Error(`This page dosen't exist`);
//   // }

//   // const tour = await Tour.find().where('something').equalTo(ss).where('rfne').equalTo('kejn');

//   // } catch (error) {
//   //   console.log(error);
//   //   res.status(404).json({
//   //     status: "fail",

//   //     message: error,
//   //   });
//   // }
// });

// route to add new tour
exports.createTour = factory.createOne(Tour);

// route to get single tour based on ID(params)
// exports.getTour = catchAsync(async (req, res, next) => {
//   // console.log(req.params.id);
//   // // if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {

//   // we can also use the populate query here
//   // Put populate while populating reviews
//   const tour = await Tour.findById(req.params.id).populate("reviews");
//   // .populate({
//   //   path: "guides",
//   //   select: "-__v -passwordChangedAt",
//   // });
//   if (!tour) {
//     return next(new AppError("No tour found with that ID", 404));
//   }
//   // }
//   // Tour.findOne({_id:req.params.id});

//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
//   // try {
//   // } catch (error) {
//   //   console.log(error);
//   //   res.status(404).json({
//   //     status: "Fail",

//   //     message: error,
//   //   });
//   // }
// });

exports.getTour = factory.getOne(Tour, { path: "reviews" });

// to update the tour data (yet to update the code )
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     return next(new AppError("No tour found with that ID", 404));
//   }
//   // console.log(tour);
//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
//   // try {
//   // } catch (error) {
//   //   res.status(404).json({
//   //     status: "fail",

//   //     message: error,
//   //   });
//   // }
// });
exports.updateTour = factory.updateOne(Tour);

// route to  deleting a tour
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const deleteTour = await Tour.findByIdAndDelete(req.params.id);

//   if (!deleteTour) {
//     return next(new AppError("No tour found with that ID", 404));
//   }

//   res.status(204).json({
//     status: "success",
//     data: "successfully deleted",
//   });
//   // try {
//   // } catch (error) {
//   //   console.log(error);
//   //   res.status(404).json({
//   //     status: "404 Not Found",
//   //     message: error,
//   //   });
//   // }
// });

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        // _id: '$ratingAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: {_id:{$ne: 'easy'}}
    // }
  ]);
  res.status(200).json({
    status: "success",
    data: stats,
  });
  // try {
  // } catch (error) {
  //   res.status(404).json({
  //     status: "404 Not Found",
  //     message: error,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: newDate(`${year}-01-01`),
          $lte: newDate(`${year}-12-31`),
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    message: plan,
  });
  // try {
  // } catch (error) {
  //   res.status(404).json({
  //     status: "error",
  //     message: error,
  //   });
  // }
});

// /tours-within?distance=233&center=-40,50&unit=mi
// /tours-within?233/center/14.664748866896895, 74.30133194495794/unit/mi
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  // seperate out the latitude and longitude
  const [lat, lng] = latlng.split(",");

  // to calculate the radius
  const radius = unit === "mi" ? distance / 3953.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the lat,lng format",
        400
      )
    );
  }
  // console.log(distance, lat, lng, unit);
  // Actual functionallity for Geo
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: "success",
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  // to convert the distance into miles or km
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the lat,lng format",
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});
