const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
    },
    discountPrice: Number,
    category: {
      type: String,
      required: true,
    },
    images: [String],
    stock: {
      type: Number,
      default: 0,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    sku: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
