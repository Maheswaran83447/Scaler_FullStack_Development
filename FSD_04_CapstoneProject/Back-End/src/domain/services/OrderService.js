const OrderRepository = require("../repositories/OrderRepository");

class OrderService {
  constructor(orderRepository = OrderRepository) {
    this.orderRepository = orderRepository;
  }

  async getOrdersForUser(userId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const dateFilter = {};
    if (query.from) {
      const fromDate = new Date(query.from);
      if (!Number.isNaN(fromDate.getTime())) {
        dateFilter.$gte = fromDate;
      }
    }
    if (query.to) {
      const toDate = new Date(query.to);
      if (!Number.isNaN(toDate.getTime())) {
        dateFilter.$lte = toDate;
      }
    }

    const filter = {};
    if (Object.keys(dateFilter).length) {
      filter.placedAt = dateFilter;
    }

    const [orders, total] = await Promise.all([
      this.orderRepository.findOrdersForUser(userId, {
        limit,
        skip,
        filter,
      }),
      this.orderRepository.countOrdersForUser(userId, filter),
    ]);

    return {
      success: true,
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        from: filter.placedAt?.$gte || null,
        to: filter.placedAt?.$lte || null,
      },
    };
  }

  async createOrderForUser(userId, payload = {}) {
    const validationError = (message) => {
      const error = new Error(message);
      error.name = "ValidationError";
      return error;
    };

    if (!userId) {
      throw validationError("User information is required to place an order");
    }

    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    if (!rawItems.length) {
      throw validationError("Order must include at least one item");
    }

    const sanitizedItems = rawItems
      .map((item) => {
        const quantity = Math.max(parseInt(item.quantity, 10) || 1, 1);
        const price = Number(item.price);
        const name = item.name || item.title;

        if (!name || Number.isNaN(price)) {
          return null;
        }

        return {
          productId: item.productId || item.id || null,
          name,
          price,
          quantity,
        };
      })
      .filter(Boolean);

    if (!sanitizedItems.length) {
      throw validationError("Order items are invalid");
    }

    const totalAmount = sanitizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const allowedPaymentMethods = new Set(["cod", "card", "upi"]);
    const paymentMethod = allowedPaymentMethods.has(payload.paymentMethod)
      ? payload.paymentMethod
      : "cod";
    const orderData = {
      user: userId,
      items: sanitizedItems,
      totalAmount,
      paymentMethod,
      status: "processing",
      placedAt: new Date(),
    };

    const shippingAddressRaw = payload.shippingAddress;
    const shippingAddress =
      shippingAddressRaw && typeof shippingAddressRaw === "object"
        ? {
            addressId:
              shippingAddressRaw.id ||
              shippingAddressRaw._id ||
              shippingAddressRaw.addressId ||
              null,
            label: shippingAddressRaw.label || null,
            tag: shippingAddressRaw.tag || null,
            addressLine1: shippingAddressRaw.addressLine1 || null,
            addressLine2: shippingAddressRaw.addressLine2 || null,
            landmark: shippingAddressRaw.landmark || null,
            city: shippingAddressRaw.city || null,
            state: shippingAddressRaw.state || null,
            pincode: shippingAddressRaw.pincode || null,
            line:
              shippingAddressRaw.line ||
              shippingAddressRaw.addressLine1 ||
              null,
            isDefaultShipping: !!shippingAddressRaw.isDefaultShipping,
            isDefaultBilling: !!shippingAddressRaw.isDefaultBilling,
            isCurrentAddress: !!shippingAddressRaw.isCurrentAddress,
          }
        : null;

    if (
      shippingAddress &&
      (shippingAddress.label ||
        shippingAddress.addressLine1 ||
        shippingAddress.city)
    ) {
      orderData.shippingAddress = shippingAddress;
    }

    const createdOrder = await this.orderRepository.createOrder(orderData);

    const orderObject =
      typeof createdOrder.toObject === "function"
        ? createdOrder.toObject()
        : createdOrder;

    return {
      success: true,
      message: "Order placed successfully",
      data: orderObject,
    };
  }
}

module.exports = new OrderService();
