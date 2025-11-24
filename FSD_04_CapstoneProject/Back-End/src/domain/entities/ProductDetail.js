const mongoose = require("mongoose");

const productDetailSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    countryOfOrigin: {
      type: String,
      trim: true,
    },
    itemModelNumber: {
      type: String,
      trim: true,
    },
    productDimensions: {
      type: String,
      trim: true,
    },
    asin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    netQuantity: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProductDetail", productDetailSchema);
