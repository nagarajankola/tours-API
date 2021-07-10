const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  // Get tour data from collection
    const tours = await Tour.find();
  // Build template

  // render template using tour data from 1
  res.status(200).render("overview", {
    title: "All tours",
    tours
  });
});

exports.getTour = catchAsync((req, res, next) => {
  res.status(200).render("tour", {
    title: "Forest Hikers",
  });
});
