import apiClient from "./apiClient";

const paymentService = {
  createOrder(payload) {
    return apiClient.post("/api/payments/order", payload);
  },
  verifyPayment(payload) {
    return apiClient.post("/api/payments/verify", payload);
  },
};

export default paymentService;
