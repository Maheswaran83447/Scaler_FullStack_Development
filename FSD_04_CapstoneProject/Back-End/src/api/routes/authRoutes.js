const express = require("express");
const { body } = require("express-validator");
const AuthHandler = require("../handlers/AuthHandler");

const router = express.Router();

router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .withMessage("Valid email address is required")
      .normalizeEmail(),
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("phoneNumber")
      .optional({ nullable: true })
      .matches(/^\+?[0-9\s-]{7,15}$/)
      .withMessage("Phone number should contain 7-15 digits"),
  ],
  (req, res) => AuthHandler.handleUserRegistration(req, res)
);

router.post(
  "/login",
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email or phone number is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  (req, res) => AuthHandler.handleUserAuthentication(req, res)
);

router.post(
  "/forgot-password",
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email or phone number is required"),
  ],
  (req, res) => AuthHandler.handlePasswordResetRequest(req, res)
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  (req, res) => AuthHandler.handlePasswordReset(req, res)
);

module.exports = router;
