const mongoose = require("mongoose");

const productReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 2000,
      required: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: "Cartify Shopper",
      maxlength: 120,
    },
  },
  {
    timestamps: true,
  }
);

productReviewSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("ProductReview", productReviewSchema);
