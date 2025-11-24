const ProductDetail = require("../entities/ProductDetail");

class ProductDetailRepository {
  async getByProductId(productId) {
    return await ProductDetail.findOne({ product: productId }).lean();
  }

  async upsertForProduct(productId, detailPayload) {
    return await ProductDetail.findOneAndUpdate(
      { product: productId },
      { $set: { ...detailPayload, product: productId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  }

  async bulkUpsert(details) {
    if (!Array.isArray(details) || !details.length) return [];

    const bulkOperations = details.map((detail) => ({
      updateOne: {
        filter: { product: detail.product },
        update: {
          $set: {
            manufacturer: detail.manufacturer,
            countryOfOrigin: detail.countryOfOrigin,
            itemModelNumber: detail.itemModelNumber,
            productDimensions: detail.productDimensions,
            asin: detail.asin,
            netQuantity: detail.netQuantity,
          },
          $setOnInsert: { product: detail.product },
        },
        upsert: true,
      },
    }));

    return await ProductDetail.bulkWrite(bulkOperations, {
      ordered: false,
    });
  }
}

module.exports = new ProductDetailRepository();
