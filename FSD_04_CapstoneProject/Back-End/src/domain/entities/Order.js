const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: null },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "upi"],
      default: "cod",
    },
    shippingAddress: {
      label: { type: String, default: null },
      line: { type: String, default: null },
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function (next) {
  if (!this.totalAmount && this.items?.length) {
    this.totalAmount = this.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
  }
  if (!this.placedAt) {
    this.placedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
