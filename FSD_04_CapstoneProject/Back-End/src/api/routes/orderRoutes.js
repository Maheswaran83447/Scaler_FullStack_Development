const express = require("express");
const OrderHandler = require("../handlers/OrderHandler");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, (req, res) =>
  OrderHandler.listOrders(req, res)
);

router.post("/", authMiddleware, (req, res) =>
  OrderHandler.createOrder(req, res)
);

module.exports = router;
