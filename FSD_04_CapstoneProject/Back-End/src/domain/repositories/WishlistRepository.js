const mongoose = require("mongoose");
const WishlistItem = require("../entities/WishlistItem");

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  try {
    return new mongoose.Types.ObjectId(String(value));
  } catch (error) {
    return null;
  }
};

class WishlistRepository {
  async listByUser(userId) {
    const objectId = toObjectId(userId);
    if (!objectId) return [];

    return await WishlistItem.find({ user: objectId })
      .populate("product", "title price discountPrice images category")
      .sort({ createdAt: -1 })
      .lean();
  }

  async addItem(userId, productId) {
    const userObjectId = toObjectId(userId);
    const productObjectId = toObjectId(productId);
    if (!userObjectId || !productObjectId) {
      throw new Error("Invalid user or product id");
    }

    const result = await WishlistItem.findOneAndUpdate(
      { user: userObjectId, product: productObjectId },
      { $setOnInsert: { user: userObjectId, product: productObjectId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("product", "title price discountPrice images category")
      .lean();

    return result;
  }

  async removeItem(userId, productId) {
    const userObjectId = toObjectId(userId);
    const productObjectId = toObjectId(productId);
    if (!userObjectId || !productObjectId) {
      throw new Error("Invalid user or product id");
    }

    const result = await WishlistItem.findOneAndDelete({
      user: userObjectId,
      product: productObjectId,
    })
      .populate("product", "title price discountPrice images category")
      .lean();

    return result;
  }
}

module.exports = new WishlistRepository();
