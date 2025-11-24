const PaymentService = require("../../domain/services/PaymentService");

class PaymentHandler {
  constructor(paymentService = PaymentService) {
    this.paymentService = paymentService;
  }

  async createOrder(req, res) {
    try {
      const { amount, currency = "INR", receipt, notes = {} } = req.body || {};

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid amount (in rupees) is required",
        });
      }

      const amountInPaise = Math.round(numericAmount * 100);
      const normalizedNotes =
        notes && typeof notes === "object" && !Array.isArray(notes)
          ? { ...notes }
          : {};
      const enrichedNotes = {
        ...normalizedNotes,
        userId: req.user?.userId || "guest",
      };

      const order = await this.paymentService.createOrder({
        amount: amountInPaise,
        currency,
        receipt,
        notes: enrichedNotes,
      });

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Unable to create Razorpay order",
      });
    }
  }

  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      } = req.body || {};

      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({
          success: false,
          message:
            "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
        });
      }

      const isValid = this.paymentService.verifySignature({
        orderId,
        paymentId,
        signature,
      });

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid Razorpay signature",
        });
      }

      res.json({ success: true, message: "Payment signature verified" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Unable to verify payment",
      });
    }
  }
}

module.exports = new PaymentHandler();
