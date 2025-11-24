const mongoose = require("mongoose");

/**
 * UserAddress Schema
 * Stores multiple shipping/billing addresses linked to a user account.
 */
const userAddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      default: "Home",
    },
    addressLine1: {
      type: String,
      trim: true,
      required: true,
    },
    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },
    landmark: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      required: true,
    },
    state: {
      type: String,
      trim: true,
      required: true,
    },
    pincode: {
      type: String,
      trim: true,
      required: true,
    },
    isDefaultShipping: {
      type: Boolean,
      default: false,
    },
    isDefaultBilling: {
      type: Boolean,
      default: false,
    },
    isCurrentAddress: {
      type: Boolean,
      default: false,
    },
    tag: {
      type: String,
      trim: true,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  {
    timestamps: true,
  }
);

userAddressSchema.index({ user: 1, createdAt: -1 });
userAddressSchema.index({ user: 1, isDefaultShipping: 1 });
userAddressSchema.index({ user: 1, isDefaultBilling: 1 });
userAddressSchema.index({ user: 1, isCurrentAddress: 1 });

module.exports = mongoose.model("UserAddress", userAddressSchema);
