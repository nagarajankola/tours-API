const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    require: (true, 'A tour must have a name'),
    unique: true,
    trim: true,
  },
  slug: String,
  duration: {
    type: Number,
    require: (true, 'A tour must have a duration'),
  },
  maxGroupSize: {
    type: Number,
    require: (true, 'A tour must have a maxGroupSize')
  },
  difficulty: {
    type: String,
    require: (true, 'A tour must have a difficulty')
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
  },
  ratingsQuantity: {
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
  summary: {
    type: String,
    require: (true, 'A tour must have a summary'),
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    require: (true, 'A tour must have a imageCover')
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false //to never to send this to user 
  },
  startDate: [Date],
  secretTour: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
})

// Document middleware, runs before save and create (not for other things)
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
})

// tourSchema.pre('save', function(next){
//   console.log("check")
//   next();
// })

// tourSchema.post('save', function(doc, next){
//   console.log(doc);
//   next();
// })

//  QUERY moddleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
})


tourSchema.post(/^find/, function (docs,next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds`);
  next();
})


// Aggregation middleware

tourSchema.pre('aggregate', function(next){
  this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
  next();
})
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;