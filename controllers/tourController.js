const Tour = require("./../models/tourModel");
const APIfeatures = require('../utils/APIfeatures');

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
exports.getAllTours = async (req, res) => {
  try {
    // BUILDING QUERY
    // 1A filtering
    // const queryObj = {...req.query};

    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);
    // // http://localhost:3000/api/v1/tours?duration=5&difficulty=easy&price=1500

    // // 1B advance filtering
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // // http://localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy&price[lt]=1500
    // console.log(JSON.parse(queryStr));

    // let query =  Tour.find(JSON.parse(queryStr));

    //  2) Sorting
    // http://localhost:3000/api/v1/tours?sort=price,-ratingsAverage
    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' '); // This .split(',').join(' ') seperates everything and joins them with space (eg: ['name duration']) coz look at the URL
    //   console.log(sortBy);
    //   query = query.sort(sortBy);
    // }else {
    //   // http://localhost:3000/api/v1/tours
    //   query = query.sort('-createdAt');
    // }

    //  3) Field limiting
    // if (req.query.fields) {
    //   // http://localhost:3000/api/v1/tours?fields=name,duration
    //   const fields = req.query.fields.split(',').join(' '); // This .split(',').join(' ') seperates everything and joins them with space (eg: ['name duration'])
    //   query = query.select(fields);
    // }else{
    //   query = query.select('-__v');  // if we add "-" it excludes that field & if we dont put it includes
    // }

    //  4) Pegination
    // http://localhost:3000/api/v1/tours?page=1&limit=3
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page-1)*limit;

    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if(skip >= numTours)
    //    throw new Error(`This page dosen't exist`);
    // }

    // const tour = await Tour.find().where('something').equalTo(ss).where('rfne').equalTo('kejn');

    // EXECUTE QUERY
    const features = new APIfeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      result: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",

      message: error,
    });
  }
};

// route to add new tour
exports.createTour = async (req, res) => {
  try {
    // console.log(req.body);
    const newTour = new Tour(req.body);
    const response = await newTour.save();
    res.status(201).json({
      status: "success",
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: "fail",

      message: error,
    });
  }
};

// route to get single tour based on ID(params)
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({_id:req.params.id});
    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Fail",

      message: error,
    });
  }
};

// to update the tour data (yet to update the code )
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    console.log(tour);
    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",

      message: error,
    });
  }
};

// route to  deleting a tour
exports.deleteTour = async (req, res) => {
  try {
    const deleteTour = await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: "successfully deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "404 Not Found",
      message: error,
    });
  }
};
