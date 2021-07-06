const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("../routes/reviewRoutes");
// const reviewController = require("../controllers/reviewController");

const router = express.Router();

// ROUTES
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// router.param('id', tourController.checkID);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

  // To get the tours within the specified radius
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getTourWithin);
// /tours-within?distance=233&center=-40,50&unit=mi
// /tours-within?233/center/-40,50/unit/mi

// To get the nearest tours in order
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistance)

router
  .route("/")
  // protected route, while loggingIn we always have to send the token
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

// As we know the review belongs to the tour so this route was moved here.
// but now its moved (routed) back to review route itself below.
// POST http://localhost:5000/api/v1/tours/tourId/reviews
// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );

router.use("/:tourId/reviews", reviewRouter);

module.exports = router;
