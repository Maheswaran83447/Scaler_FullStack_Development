const ProductDescription = require("../entities/ProductDescription");

class ProductDescriptionRepository {
  async getByProductId(productId) {
    return await ProductDescription.findOne({ product: productId }).lean();
  }

  async upsertForProduct(productId, descriptionHtml, wordCount = 0) {
    const payload = {
      descriptionHtml,
      wordCount,
      product: productId,
    };

    return await ProductDescription.findOneAndUpdate(
      { product: productId },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  }

  async bulkUpsert(records = []) {
    if (!Array.isArray(records) || !records.length) return [];

    const operations = records.map((record) => ({
      updateOne: {
        filter: { product: record.product },
        update: {
          $set: {
            descriptionHtml: record.descriptionHtml,
            wordCount: record.wordCount || 0,
          },
          $setOnInsert: { product: record.product },
        },
        upsert: true,
      },
    }));

    return await ProductDescription.bulkWrite(operations, { ordered: false });
  }
}

module.exports = new ProductDescriptionRepository();
