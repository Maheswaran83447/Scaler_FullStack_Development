import apiClient from "./apiClient";

const wishlistService = {
  async list(userId) {
    if (!userId) {
      throw new Error("User ID is required to fetch wishlist");
    }
    return await apiClient.get(`/api/wishlist/${userId}`);
  },

  async add(userId, productId) {
    if (!userId || !productId) {
      throw new Error("userId and productId are required to add wishlist item");
    }
    return await apiClient.post("/api/wishlist", { userId, productId });
  },

  async remove(userId, productId) {
    if (!userId || !productId) {
      throw new Error(
        "userId and productId are required to remove wishlist item"
      );
    }
    return await apiClient.delete(`/api/wishlist/${userId}/${productId}`);
  },
};

export default wishlistService;
