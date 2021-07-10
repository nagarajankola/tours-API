const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const APIfeatures = require("./utils/APIfeatures");

const app = express();

// GLOBAL-MIDDLEWARES

// Secure/Set http headers
app.use(helmet());

// this package gives a pretty representation of the requests made to the routes
// only useful in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// This snippet limits the server to make many requests
const limiter = rateLimit({
  max: 10000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour.",
});
app.use("/api", limiter);

// Body parser [reading the body as req.body]
app.use(express.json({ limit: "10mb" }));

// Data sanitization against NoSQL query injection
// in short: to stop someone to login to the app without using email but only with password
// if we put <{"$gt":""}> in place of email and any password thn we will be logged in as the user whos password matches with the current one
app.use(mongoSanitize());

// Data sanitization against XSS
// It wont allow any html type of code, it will change em into entity
app.use(xss());

// Prevent parameter pollution
// removes parameter pollution.
// eg: [in the url if we use 2 sortBy sortBy, it will make it work]
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// this is for frontend
app.use(express.static(`${__dirname}/public`));

// Test middlewares
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// app.use((req, res, next) => {
//   console.log('This is middleware');
//   next();
// });

// RULE: FAT MODELS AND THIN CONTROLLERS
// Redirecting routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Error handling
// After searching all the routes the control will reach here and send them the response. Order we metion matters!!!!!
app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status:'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // })

  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail',
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error handling (yeah kinda advanced)
app.use(globalErrorHandler);

module.exports = app;
