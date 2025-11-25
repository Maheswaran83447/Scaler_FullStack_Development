const express = require("express");
const CartHandler = require("../handlers/CartHandler");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

/**
 * @route GET /api/cart
 * @desc Get user's cart
 * @access Private
 */
router.get("/", CartHandler.handleGetCart);

/**
 * @route POST /api/cart/add
 * @desc Add item to cart
 * @access Private
 * @body { productId: String, quantity: Number }
 */
router.post("/add", CartHandler.handleAddItem);

/**
 * @route PUT /api/cart/update
 * @desc Update item quantity in cart
 * @access Private
 * @body { productId: String, quantity: Number }
 */
router.put("/update", CartHandler.handleUpdateItem);

/**
 * @route DELETE /api/cart/remove/:productId
 * @desc Remove item from cart
 * @access Private
 */
router.delete("/remove/:productId", CartHandler.handleRemoveItem);

/**
 * @route DELETE /api/cart/clear
 * @desc Clear entire cart
 * @access Private
 */
router.delete("/clear", CartHandler.handleClearCart);

/**
 * @route POST /api/cart/sync
 * @desc Sync cart (merge localStorage with server)
 * @access Private
 * @body { items: Array<{ productId: String, quantity: Number }> }
 */
router.post("/sync", CartHandler.handleSyncCart);

module.exports = router;
