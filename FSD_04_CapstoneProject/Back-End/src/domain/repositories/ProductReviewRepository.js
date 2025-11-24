const mongoose = require("mongoose");
const ProductReview = require("../entities/ProductReview");

const DISTRIBUTION_TEMPLATE = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

const toObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(String(value));
};

class ProductReviewRepository {
  async createReview(productId, payload) {
    const doc = await ProductReview.create({
      product: toObjectId(productId),
      rating: payload.rating,
      comment: payload.comment,
      displayName: payload.displayName,
    });
    return doc.toObject({ versionKey: false });
  }

  async getOverview(productId, recentLimit = 6) {
    const objectId = toObjectId(productId);

    const aggregation = await ProductReview.aggregate([
      { $match: { product: objectId } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                average: { $avg: "$rating" },
              },
            },
          ],
          distribution: [
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const totals = aggregation?.[0]?.totals?.[0] || null;
    const distributionDocs = aggregation?.[0]?.distribution || [];
    const distribution = { ...DISTRIBUTION_TEMPLATE };

    distributionDocs.forEach((entry) => {
      const key = Number(entry._id);
      if (distribution[key] !== undefined) {
        distribution[key] = entry.count;
      }
    });

    const recent = await ProductReview.find({ product: objectId })
      .sort({ createdAt: -1 })
      .limit(recentLimit)
      .lean()
      .exec();

    const summary = {
      totalReviews: totals ? totals.total : 0,
      averageRating: totals ? Number(totals.average.toFixed(1)) : 0,
      distribution,
    };

    const recentReviews = recent.map((review) => ({
      id: review._id.toString(),
      comment: review.comment,
      rating: review.rating,
      displayName: review.displayName || "Cartify Shopper",
      createdAt: review.createdAt,
    }));

    return { summary, recentReviews };
  }

  async getSummariesForProducts(productIds = []) {
    if (!Array.isArray(productIds) || !productIds.length) return {};

    const objectIds = productIds.map((id) => toObjectId(id));
    const aggregation = await ProductReview.aggregate([
      { $match: { product: { $in: objectIds } } },
      {
        $group: {
          _id: "$product",
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const summaryMap = {};
    aggregation.forEach((entry) => {
      if (!entry?._id) return;
      summaryMap[entry._id.toString()] = {
        totalReviews: entry.totalReviews,
        averageRating: Number(entry.averageRating?.toFixed(1) || 0),
      };
    });

    objectIds.forEach((objectId) => {
      const key = objectId.toString();
      if (!summaryMap[key]) {
        summaryMap[key] = {
          totalReviews: 0,
          averageRating: 0,
        };
      }
    });

    return summaryMap;
  }
}

module.exports = new ProductReviewRepository();
