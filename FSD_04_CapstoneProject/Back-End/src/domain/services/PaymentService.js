const crypto = require("crypto");
const { getRazorpayClient } = require("../../lib/razorpayClient");

class PaymentService {
  async createOrder({ amount, currency = "INR", receipt, notes = {} }) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        "A positive amount (in paise) is required to create an order"
      );
    }

    const client = getRazorpayClient();

    const orderPayload = {
      amount: Math.round(amount),
      currency,
      receipt,
      notes,
    };

    if (!orderPayload.receipt) {
      orderPayload.receipt = `rcpt_${Date.now()}`;
    }

    return client.orders.create(orderPayload);
  }

  verifySignature({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) {
      throw new Error(
        "razorpay_order_id, razorpay_payment_id and razorpay_signature are required"
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay secret key missing from environment");
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${orderId}|${paymentId}`);
    const digest = hmac.digest("hex");

    return digest === signature;
  }
}

module.exports = new PaymentService();
