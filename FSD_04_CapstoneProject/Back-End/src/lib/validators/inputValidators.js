const { body } = require("express-validator");

const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateProduct = [
  body("title")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("Product title is required and must be at least 3 characters"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category").notEmpty().withMessage("Category is required"),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
};
