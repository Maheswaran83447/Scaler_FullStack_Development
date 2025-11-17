const Order = require("../entities/Order");

class OrderRepository {
  async findOrdersForUser(userId, options = {}) {
    const criteria = { user: userId };
    if (options.filter?.placedAt) {
      criteria.placedAt = options.filter.placedAt;
    }

    const query = Order.find(criteria).sort({ placedAt: -1 }).lean();

    if (options.limit) {
      query.limit(options.limit);
    }

    if (options.skip) {
      query.skip(options.skip);
    }

    return await query;
  }

  async createOrder(orderData) {
    const order = new Order(orderData);
    return await order.save();
  }

  async countOrdersForUser(userId, filter = {}) {
    const criteria = { user: userId };
    if (filter.placedAt) {
      criteria.placedAt = filter.placedAt;
    }

    return await Order.countDocuments(criteria);
  }
}

module.exports = new OrderRepository();
