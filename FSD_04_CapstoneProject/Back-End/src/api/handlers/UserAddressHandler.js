const mongoose = require("mongoose");
const UserAddressRepository = require("../../domain/repositories/UserAddressRepository");
const UserAccount = require("../../domain/entities/User");

const normaliseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(lower)) return true;
    if (["false", "0", "no", "n", "off"].includes(lower)) return false;
  }
  if (typeof value === "number") return value === 1;
  return fallback;
};

const allowedTags = new Set(["home", "work", "other"]);

const sanitizeAddressPayload = (payload = {}) => {
  const tag =
    typeof payload.tag === "string" ? payload.tag.toLowerCase() : "home";
  return {
    label: payload.label?.trim() || "Home",
    addressLine1: payload.addressLine1?.trim() || "",
    addressLine2: payload.addressLine2?.trim() || "",
    landmark: payload.landmark?.trim() || "",
    city: payload.city?.trim() || "",
    state: payload.state?.trim() || "",
    pincode: payload.pincode ? String(payload.pincode).trim() : "",
    tag: allowedTags.has(tag) ? tag : "other",
    isDefaultShipping: normaliseBoolean(payload.isDefaultShipping, false),
    isDefaultBilling: normaliseBoolean(payload.isDefaultBilling, false),
    isCurrentAddress: normaliseBoolean(payload.isCurrentAddress, false),
  };
};

const validateUserId = (userId) => {
  if (!userId) return false;
  if (mongoose.Types.ObjectId.isValid(userId)) return true;
  return false;
};

const UserAddressHandler = {
  async listUserAddresses(req, res, next) {
    try {
      const userId = req.params.userId || req.query.userId;
      if (!validateUserId(userId)) {
        return res.status(400).json({
          success: false,
          message: "A valid userId is required to fetch addresses",
        });
      }

      const userExists = await UserAccount.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const addresses = await UserAddressRepository.getAddressesForUser(userId);
      return res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  },

  async createUserAddress(req, res, next) {
    try {
      const { userId, ...addressPayload } = req.body || {};

      if (!validateUserId(userId)) {
        return res.status(400).json({
          success: false,
          message: "A valid userId is required to create an address",
        });
      }

      const userExists = await UserAccount.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const sanitizedPayload = sanitizeAddressPayload(addressPayload);
      if (
        !sanitizedPayload.addressLine1 ||
        !sanitizedPayload.city ||
        !sanitizedPayload.state ||
        !sanitizedPayload.pincode
      ) {
        return res.status(400).json({
          success: false,
          message: "Address line, city, state, and pincode are required",
        });
      }

      const created = await UserAddressRepository.createAddress(
        userId,
        sanitizedPayload
      );

      const plainAddress = created?.toObject ? created.toObject() : created;

      return res.status(201).json({ success: true, data: plainAddress });
    } catch (error) {
      next(error);
    }
  },

  async deleteUserAddress(req, res, next) {
    try {
      const { addressId } = req.params;
      const userId = req.query.userId || req.body?.userId;

      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(400).json({
          success: false,
          message: "A valid addressId is required",
        });
      }

      if (!validateUserId(userId)) {
        return res.status(400).json({
          success: false,
          message: "A valid userId is required to delete an address",
        });
      }

      const userExists = await UserAccount.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const address = await UserAddressRepository.getAddressById(addressId);
      if (!address || String(address.user) !== String(userId)) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }

      await UserAddressRepository.deleteAddress(addressId);

      return res.json({
        success: true,
        message: "Address removed successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UserAddressHandler;
