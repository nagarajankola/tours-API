const Tour = require("./../models/tourModel");

// getting all tours from json file
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// route to get all tours
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find();
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
