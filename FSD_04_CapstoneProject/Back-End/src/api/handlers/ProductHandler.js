const Product = require("../../domain/entities/Product");
const ProductDetailRepository = require("../../domain/repositories/ProductDetailRepository");
const ProductDescriptionRepository = require("../../domain/repositories/ProductDescriptionRepository");
const ProductReviewRepository = require("../../domain/repositories/ProductReviewRepository");

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

    let augmentedProducts = products;
    if (products.length) {
      try {
        const summaries = await ProductReviewRepository.getSummariesForProducts(
          products.map((product) => product._id)
        );
        augmentedProducts = products.map((product) => {
          const summary = summaries[product._id.toString()];
          return summary
            ? {
                ...product,
                averageRating: summary.averageRating,
                reviewCount: summary.totalReviews,
              }
            : { ...product, averageRating: 0, reviewCount: 0 };
        });
      } catch (summaryError) {
        console.warn("Failed to load review summaries", summaryError);
      }
    }

    res.json({
      success: true,
      data: augmentedProducts,
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

    let detail = null;
    let description = null;
    let reviewOverview = null;
    try {
      detail = await ProductDetailRepository.getByProductId(product._id);
    } catch (detailError) {
      console.warn(
        "Failed to load product details for product",
        product._id,
        detailError
      );
    }

    try {
      description =
        (await ProductDescriptionRepository.getByProductId(product._id)) ||
        null;
    } catch (descriptionError) {
      console.warn(
        "Failed to load product description for product",
        product._id,
        descriptionError
      );
    }

    try {
      reviewOverview = await ProductReviewRepository.getOverview(product._id);
    } catch (reviewError) {
      console.warn(
        "Failed to load product reviews for product",
        product._id,
        reviewError
      );
    }

    let payload = { ...product };
    if (detail) {
      payload.productDetails = detail;
    }
    if (description) {
      payload.productDescription = description;
    }
    if (reviewOverview) {
      payload.reviewSummary = reviewOverview.summary;
      payload.recentReviews = reviewOverview.recentReviews;
    }

    res.json({ success: true, data: payload });
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

const createProductReview = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId, { _id: 1 }).lean();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const rawRating = Number(req.body.rating);
    const clampedRating = Math.min(5, Math.max(1, Math.round(rawRating || 5)));
    const comment = (req.body.comment || "").trim();
    const displayName = (req.body.displayName || "Cartify Shopper").trim();

    if (!comment.length) {
      return res
        .status(400)
        .json({ success: false, message: "Review text is required" });
    }

    const review = await ProductReviewRepository.createReview(product._id, {
      rating: clampedRating,
      comment,
      displayName: displayName || "Cartify Shopper",
    });

    const overview = await ProductReviewRepository.getOverview(product._id);

    res.status(201).json({
      success: true,
      data: review,
      meta: {
        reviewSummary: overview.summary,
        recentReviews: overview.recentReviews,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProducts,
  getProductById,
  searchProducts,
  createProductReview,
};
