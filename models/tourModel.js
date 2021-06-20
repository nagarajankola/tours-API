const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      require: (true, 'A tour must have a name'),
      unique: true,
      trim: true,
    },
    duration:{
      type: Number,
      require: (true, 'A tour must have a duration'),
    },
    maxGroupSize:{
      type: Number,
      require: (true, 'A tour must have a maxGroupSize')
    },
    difficulty:{
      type: String,
      require: (true, 'A tour must have a difficulty')
    },
    ratingsAverage:{
      type: Number,
      default:4.5,
    },
    ratingsQuantity:{
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      require: (true, 'A tour must have a price'),
    },
    priceDiscount: Number,
    summary:{
      type: String,
      require: (true, 'A tour must have a summary'),
      trim: true,
    },
    description:{
      type: String,
      trim: true,
    },
    imageCover:{
      type: String,
      require: (true, 'A tour must have a imageCover')
    },
    images:[String],
    createdAt:{
      type: Date,
      default: Date.now(),
    },
    startDate: [Date]
  });
  
  const Tour = mongoose.model('Tour', tourSchema);
  
  module.exports = Tour;