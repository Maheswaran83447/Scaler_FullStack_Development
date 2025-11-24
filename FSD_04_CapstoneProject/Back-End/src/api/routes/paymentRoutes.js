const express = require("express");
const PaymentHandler = require("../handlers/PaymentHandler");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/order", authMiddleware, (req, res) =>
  PaymentHandler.createOrder(req, res)
);

router.post("/verify", authMiddleware, (req, res) =>
  PaymentHandler.verifyPayment(req, res)
);

module.exports = router;
