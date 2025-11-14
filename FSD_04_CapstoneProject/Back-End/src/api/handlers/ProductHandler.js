const Product = require("../../domain/entities/Product");

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listProducts = async (req, res, next) => {
  try {
    // Added Pagination to faster load times as it was loading all products at once
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 24, 1),
      1000
    );
    const category = req.query.category;

    const query = { isActive: true };
    if (category) query.category = category;

    // return only listing fields to reduce payload
    const projection = {
      title: 1,
      description: 1,
      price: 1,
      discountPrice: 1,
      category: 1,
      images: 1,
      stock: 1,
      sku: 1,
    };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query, projection)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).lean();
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const term = (req.query.q || req.query.query || "").trim();

    if (term.length < 3) {
      return res.json({ success: true, data: [], meta: { query: term } });
    }

    const regex = new RegExp(escapeRegex(term), "i");
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 25);

    const query = {
      isActive: true,
      $or: [{ title: regex }, { description: regex }, { tags: regex }],
    };

    const projection = { title: 1, price: 1, category: 1 };
    const results = await Product.find(query, projection).limit(limit).lean();

    res.json({ success: true, data: results, meta: { query: term, limit } });
  } catch (err) {
    next(err);
  }
};

module.exports = { listProducts, getProductById, searchProducts };
