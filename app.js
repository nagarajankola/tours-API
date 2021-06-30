const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// GLOBAL-MIDDLEWARES
// this package gives a pretty representation of the requests made to the routes
// only useful in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// This snippet limits the server to make many requests
const limiter =rateLimit({
  max:100,
  windowMs: 60*60*1000,
  message: 'Too many requests from this IP, please try again in an hour.'
})
app.use('/api',limiter);

app.use(express.json());

// this is for frontend
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next)=>{
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
})

// app.use((req, res, next) => {
//   console.log('This is middleware');
//   next();
// });

// RULE: FAT MODELS AND THIN CONTROLLERS
// Redirecting routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Error handling
// After searching all the routes the control will reach here and send them the response. Order we metion matters!!!!! 
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status:'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // })

  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail',
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
})

// Error handling (yeah kinda advanced)
app.use(globalErrorHandler);

module.exports = app;
