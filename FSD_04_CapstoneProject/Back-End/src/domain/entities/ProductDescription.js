const mongoose = require("mongoose");

const productDescriptionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    descriptionHtml: {
      type: String,
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProductDescription", productDescriptionSchema);
