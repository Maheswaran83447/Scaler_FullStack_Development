import apiClient from "./apiClient";

const orderService = {
  async fetchOrders({ from, to, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (from) {
      params.set("from", from);
    }
    if (to) {
      params.set("to", to);
    }

    const queryString = params.toString();
    return apiClient.get(`/api/orders?${queryString}`);
  },

  async createOrder(orderPayload) {
    return apiClient.post("/api/orders", orderPayload);
  },
};

export default orderService;
