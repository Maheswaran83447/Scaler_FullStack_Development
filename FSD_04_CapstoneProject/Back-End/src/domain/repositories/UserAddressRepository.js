const UserAddress = require("../entities/UserAddress");

class UserAddressRepository {
  async createAddress(userId, addressPayload) {
    const payload = {
      ...addressPayload,
      user: userId,
    };

    if (payload.isCurrentAddress) {
      await this.clearCurrentAddress(userId);
      payload.isDefaultShipping = true;
    }

    if (payload.isDefaultShipping) {
      await this.clearDefaultFlags(userId, "shipping");
    }

    if (payload.isDefaultBilling) {
      await this.clearDefaultFlags(userId, "billing");
    }

    const address = new UserAddress(payload);
    return await address.save();
  }

  async getAddressesForUser(userId) {
    return await UserAddress.find({ user: userId })
      .sort({ isDefaultShipping: -1, createdAt: -1 })
      .lean();
  }

  async getAddressById(addressId) {
    return await UserAddress.findById(addressId).lean();
  }

  async updateAddress(addressId, updatePayload) {
    const address = await UserAddress.findById(addressId);
    if (!address) return null;

    if (updatePayload.isCurrentAddress) {
      await this.clearCurrentAddress(address.user);
      updatePayload.isDefaultShipping = true;
    }

    if (updatePayload.isDefaultShipping) {
      await this.clearDefaultFlags(address.user, "shipping");
    }

    if (updatePayload.isDefaultBilling) {
      await this.clearDefaultFlags(address.user, "billing");
    }

    return await UserAddress.findByIdAndUpdate(addressId, updatePayload, {
      new: true,
    }).lean();
  }

  async deleteAddress(addressId) {
    return await UserAddress.findByIdAndDelete(addressId).lean();
  }

  async clearDefaultFlags(userId, type = "shipping") {
    const field = type === "billing" ? "isDefaultBilling" : "isDefaultShipping";
    await UserAddress.updateMany({ user: userId }, { [field]: false });
  }

  async clearCurrentAddress(userId) {
    await UserAddress.updateMany({ user: userId }, { isCurrentAddress: false });
  }

  async setDefaultAddress(userId, addressId, type = "shipping") {
    await this.clearDefaultFlags(userId, type);
    const updatePayload = {
      [type === "billing" ? "isDefaultBilling" : "isDefaultShipping"]: true,
    };

    if (type !== "billing") {
      await this.clearCurrentAddress(userId);
      updatePayload.isCurrentAddress = true;
    }
    return await UserAddress.findByIdAndUpdate(addressId, updatePayload, {
      new: true,
    }).lean();
  }

  async setCurrentAddress(userId, addressId) {
    await this.clearCurrentAddress(userId);
    await this.clearDefaultFlags(userId, "shipping");
    return await UserAddress.findOneAndUpdate(
      { _id: addressId, user: userId },
      { isCurrentAddress: true, isDefaultShipping: true },
      { new: true }
    ).lean();
  }
}

module.exports = new UserAddressRepository();
