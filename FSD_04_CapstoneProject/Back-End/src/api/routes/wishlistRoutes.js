const express = require("express");
const router = express.Router();
const WishlistHandler = require("../handlers/WishlistHandler");

router.get("/:userId", WishlistHandler.listWishlist);
router.post("/", WishlistHandler.addWishlistItem);
router.delete("/:userId/:productId", WishlistHandler.removeWishlistItem);

module.exports = router;
