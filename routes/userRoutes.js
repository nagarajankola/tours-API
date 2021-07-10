const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// This will protect all the routes which comes after this line
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);

router.get(
  "/me",
  authController.protect,
  userController.getMe,
  userController.getUser
);
// route to update the personal info of the user by user
router.patch("/updateMe", userController.updateMe);
// basically making them inactive
router.delete("/deleteMe", userController.deleteMe);

// Only admin can access the routes which comes after this line
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
