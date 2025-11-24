const OrderService = require("../../domain/services/OrderService");

class OrderHandler {
  constructor(orderService = OrderService) {
    this.orderService = orderService;
  }

  async listOrders(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication is required to view orders",
        });
      }

      const orders = await this.orderService.getOrdersForUser(
        userId,
        req.query
      );
      res.json(orders);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Unable to fetch orders",
      });
    }
  }

  async createOrder(req, res) {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required to place orders",
      });
    }

    try {
      const result = await this.orderService.createOrderForUser(
        userId,
        req.body
      );
      res.status(201).json(result);
    } catch (error) {
      const status = error.name === "ValidationError" ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Unable to place order",
      });
    }
  }
}

module.exports = new OrderHandler();
