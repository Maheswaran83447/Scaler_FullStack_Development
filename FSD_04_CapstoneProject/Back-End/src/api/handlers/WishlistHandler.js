const Product = require("../../domain/entities/Product");
const WishlistRepository = require("../../domain/repositories/WishlistRepository");

const sanitizeWishlistItem = (item) => {
  if (!item) return null;
  const product =
    item.product && typeof item.product === "object"
      ? {
          id: item.product._id?.toString(),
          title: item.product.title,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          images: item.product.images,
          category: item.product.category,
        }
      : null;

  return {
    id: item._id?.toString(),
    userId: item.user?.toString?.() || undefined,
    productId: item.product?._id?.toString() || item.product?.toString?.(),
    product,
    createdAt: item.createdAt,
  };
};

const listWishlist = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User id is required" });
    }

    const items = await WishlistRepository.listByUser(userId);
    res.json({
      success: true,
      data: items.map((item) => sanitizeWishlistItem(item)),
    });
  } catch (error) {
    next(error);
  }
};

const addWishlistItem = async (req, res, next) => {
  try {
    const { userId, productId } = req.body || {};
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required",
      });
    }

    const productExists = await Product.exists({
      _id: productId,
      isActive: true,
    });
    if (!productExists) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const item = await WishlistRepository.addItem(userId, productId);
    res.status(201).json({
      success: true,
      data: sanitizeWishlistItem(item),
    });
  } catch (error) {
    next(error);
  }
};

const removeWishlistItem = async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required",
      });
    }

    await WishlistRepository.removeItem(userId, productId);

    res.json({
      success: true,
      data: { userId, productId },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listWishlist, addWishlistItem, removeWishlistItem };
