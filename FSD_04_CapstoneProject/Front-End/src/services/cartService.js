import apiClient from "./apiClient";

const CART_API_BASE = "/cart";

/**
 * Get user's cart from server
 */
export const getCart = async () => {
  try {
    const response = await apiClient.get(CART_API_BASE);
    return response.data;
  } catch (error) {
    console.error("Get cart error:", error);
    throw error;
  }
};

/**
 * Add item to cart on server
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 */
export const addItemToCart = async (productId, quantity = 1) => {
  try {
    const response = await apiClient.post(`${CART_API_BASE}/add`, {
      productId,
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error("Add item to cart error:", error);
    throw error;
  }
};

/**
 * Update item quantity in cart
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 */
export const updateCartItem = async (productId, quantity) => {
  try {
    const response = await apiClient.put(`${CART_API_BASE}/update`, {
      productId,
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error("Update cart item error:", error);
    throw error;
  }
};

/**
 * Remove item from cart
 * @param {string} productId - Product ID
 */
export const removeCartItem = async (productId) => {
  try {
    const response = await apiClient.delete(
      `${CART_API_BASE}/remove/${productId}`
    );
    return response.data;
  } catch (error) {
    console.error("Remove cart item error:", error);
    throw error;
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async () => {
  try {
    const response = await apiClient.delete(`${CART_API_BASE}/clear`);
    return response.data;
  } catch (error) {
    console.error("Clear cart error:", error);
    throw error;
  }
};

/**
 * Sync cart with server (merge localStorage with server cart)
 * @param {Array} items - Array of {productId, quantity}
 */
export const syncCart = async (items) => {
  try {
    const response = await apiClient.post(`${CART_API_BASE}/sync`, { items });
    return response.data;
  } catch (error) {
    console.error("Sync cart error:", error);
    throw error;
  }
};

const cartService = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
};

export default cartService;
