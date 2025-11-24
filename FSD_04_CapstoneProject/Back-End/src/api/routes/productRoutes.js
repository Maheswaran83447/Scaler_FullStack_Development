const express = require("express");
const router = express.Router();
const ProductHandler = require("../handlers/ProductHandler");

router.get("/search", ProductHandler.searchProducts);
router.get("/", ProductHandler.listProducts);
router.get("/:id", ProductHandler.getProductById);
router.post("/:id/reviews", ProductHandler.createProductReview);

module.exports = router;
