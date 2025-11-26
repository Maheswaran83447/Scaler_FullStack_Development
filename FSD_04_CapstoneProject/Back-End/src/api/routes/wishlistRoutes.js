const express = require("express");
const router = express.Router();
const WishlistHandler = require("../handlers/WishlistHandler");
const authMiddleware = require("../middleware/authMiddleware");

// All wishlist routes require authentication
router.use(authMiddleware);

router.get("/:userId", WishlistHandler.listWishlist);
router.post("/", WishlistHandler.addWishlistItem);
router.delete("/:userId/:productId", WishlistHandler.removeWishlistItem);

module.exports = router;
