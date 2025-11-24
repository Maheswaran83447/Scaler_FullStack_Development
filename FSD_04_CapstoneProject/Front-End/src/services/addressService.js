import apiClient from "./apiClient";

const addressService = {
  async list(userId) {
    if (!userId) {
      throw new Error("User ID is required to fetch addresses");
    }
    return await apiClient.get(`/api/user-addresses/${userId}`);
  },

  async create(userId, payload) {
    if (!userId) {
      throw new Error("User ID is required to create an address");
    }
    return await apiClient.post("/api/user-addresses", {
      userId,
      ...payload,
    });
  },

  async remove(addressId, userId) {
    if (!addressId) {
      throw new Error("Address ID is required to delete an address");
    }
    if (!userId) {
      throw new Error("User ID is required to delete an address");
    }
    const query = new URLSearchParams({ userId }).toString();
    return await apiClient.delete(`/api/user-addresses/${addressId}?${query}`);
  },
};

export default addressService;
