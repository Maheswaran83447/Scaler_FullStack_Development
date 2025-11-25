const CartRepository = require("../../domain/repositories/CartRepository");

class CartHandler {
  /**
   * Get cart for authenticated user
   */
  async handleGetCart(req, res) {
    try {
      const userId = req.userId; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const cart = await CartRepository.findByUserId(userId);

      return res.status(200).json({
        success: true,
        cart: cart || { userId, items: [] },
      });
    } catch (error) {
      console.error("Get cart error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve cart",
        error: error.message,
      });
    }
  }

  /**
   * Add item to cart
   */
  async handleAddItem(req, res) {
    try {
      const userId = req.userId;
      const { productId, quantity = 1 } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      const cart = await CartRepository.addItem(userId, productId, quantity);

      return res.status(200).json({
        success: true,
        message: "Item added to cart",
        cart,
      });
    } catch (error) {
      console.error("Add item to cart error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add item to cart",
        error: error.message,
      });
    }
  }

  /**
   * Update item quantity in cart
   */
  async handleUpdateItem(req, res) {
    try {
      const userId = req.userId;
      const { productId, quantity } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!productId || quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: "Product ID and quantity are required",
        });
      }

      const cart = await CartRepository.updateItemQuantity(
        userId,
        productId,
        quantity
      );

      return res.status(200).json({
        success: true,
        message:
          quantity > 0 ? "Item quantity updated" : "Item removed from cart",
        cart,
      });
    } catch (error) {
      console.error("Update cart item error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update cart item",
        error: error.message,
      });
    }
  }

  /**
   * Remove item from cart
   */
  async handleRemoveItem(req, res) {
    try {
      const userId = req.userId;
      const { productId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      const cart = await CartRepository.removeItem(userId, productId);

      return res.status(200).json({
        success: true,
        message: "Item removed from cart",
        cart,
      });
    } catch (error) {
      console.error("Remove item from cart error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to remove item from cart",
        error: error.message,
      });
    }
  }

  /**
   * Clear cart
   */
  async handleClearCart(req, res) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const cart = await CartRepository.clearCart(userId);

      return res.status(200).json({
        success: true,
        message: "Cart cleared",
        cart,
      });
    } catch (error) {
      console.error("Clear cart error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to clear cart",
        error: error.message,
      });
    }
  }

  /**
   * Sync cart (merge localStorage with server cart)
   */
  async handleSyncCart(req, res) {
    try {
      const userId = req.userId;
      const { items } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: "Items array is required",
        });
      }

      const cart = await CartRepository.syncCart(userId, items);

      return res.status(200).json({
        success: true,
        message: "Cart synced successfully",
        cart,
      });
    } catch (error) {
      console.error("Sync cart error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to sync cart",
        error: error.message,
      });
    }
  }
}

module.exports = new CartHandler();
