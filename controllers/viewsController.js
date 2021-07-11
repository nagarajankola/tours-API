const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  // Get tour data from collection
  const tours = await Tour.find();
  // Build template

  // render template using tour data from 1
  res.status(200).render("overview", {
    title: "All tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });
  // 2) Build the template

  // 3) Render template from the data from 1
  res.status(200).render("tour", {
    title: "The Forest Hikers Tour",
    tour
  });
});
