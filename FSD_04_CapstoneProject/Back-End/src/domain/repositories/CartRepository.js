const Cart = require("../entities/Cart");

class CartRepository {
  /**
   * Find cart by userId
   * @param {String} userId - User ID
   * @returns {Promise<Cart>} Cart document
   */
  async findByUserId(userId) {
    try {
      return await Cart.findOne({ userId }).populate("items.productId");
    } catch (error) {
      throw new Error(`Error finding cart: ${error.message}`);
    }
  }

  /**
   * Get or create cart for user
   * @param {String} userId - User ID
   * @returns {Promise<Cart>} Cart document
   */
  async getOrCreateCart(userId) {
    try {
      let cart = await this.findByUserId(userId);
      if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
      }
      return cart;
    } catch (error) {
      throw new Error(`Error getting or creating cart: ${error.message}`);
    }
  }

  /**
   * Add or update item in cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to add
   * @returns {Promise<Cart>} Updated cart
   */
  async addItem(userId, productId, quantity = 1) {
    try {
      const cart = await this.getOrCreateCart(userId);
      cart.addItem(productId, quantity);
      await cart.save();
      return await this.findByUserId(userId);
    } catch (error) {
      throw new Error(`Error adding item to cart: ${error.message}`);
    }
  }

  /**
   * Update item quantity in cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - New quantity
   * @returns {Promise<Cart>} Updated cart
   */
  async updateItemQuantity(userId, productId, quantity) {
    try {
      const cart = await this.findByUserId(userId);
      if (!cart) {
        throw new Error("Cart not found");
      }

      cart.updateItemQuantity(productId, quantity);
      await cart.save();
      return await this.findByUserId(userId);
    } catch (error) {
      throw new Error(`Error updating item quantity: ${error.message}`);
    }
  }

  /**
   * Remove item from cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @returns {Promise<Cart>} Updated cart
   */
  async removeItem(userId, productId) {
    try {
      const cart = await this.findByUserId(userId);
      if (!cart) {
        throw new Error("Cart not found");
      }

      cart.removeItem(productId);
      await cart.save();
      return await this.findByUserId(userId);
    } catch (error) {
      throw new Error(`Error removing item from cart: ${error.message}`);
    }
  }

  /**
   * Clear all items from cart
   * @param {String} userId - User ID
   * @returns {Promise<Cart>} Empty cart
   */
  async clearCart(userId) {
    try {
      const cart = await this.findByUserId(userId);
      if (!cart) {
        return await this.getOrCreateCart(userId);
      }

      cart.clearCart();
      await cart.save();
      return cart;
    } catch (error) {
      throw new Error(`Error clearing cart: ${error.message}`);
    }
  }

  /**
   * Sync multiple items to cart (for merging localStorage with server)
   * @param {String} userId - User ID
   * @param {Array} items - Array of {productId, quantity}
   * @returns {Promise<Cart>} Updated cart
   */
  async syncCart(userId, items) {
    try {
      const cart = await this.getOrCreateCart(userId);

      // Add or update each item
      for (const item of items) {
        const existingItemIndex = cart.items.findIndex(
          (i) => i.productId.toString() === item.productId.toString()
        );

        if (existingItemIndex > -1) {
          // Update quantity (merge by taking the maximum)
          cart.items[existingItemIndex].quantity = Math.max(
            cart.items[existingItemIndex].quantity,
            item.quantity
          );
        } else {
          // Add new item
          cart.items.push({
            productId: item.productId,
            quantity: item.quantity,
            addedAt: new Date(),
          });
        }
      }

      await cart.save();
      return await this.findByUserId(userId);
    } catch (error) {
      throw new Error(`Error syncing cart: ${error.message}`);
    }
  }

  /**
   * Delete cart for user
   * @param {String} userId - User ID
   * @returns {Promise<Boolean>} Success status
   */
  async deleteCart(userId) {
    try {
      await Cart.deleteOne({ userId });
      return true;
    } catch (error) {
      throw new Error(`Error deleting cart: ${error.message}`);
    }
  }
}

module.exports = new CartRepository();
