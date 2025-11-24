require("dotenv").config();
const mongoose = require("mongoose");
const { connectDatabase } = require("../infrastructure/database/connection");
const Product = require("../domain/entities/Product");
const ProductDetail = require("../domain/entities/ProductDetail");

const manufacturers = [
  "Cartify Essentials",
  "Northwind Traders",
  "Contoso Industries",
  "Globex Retail",
  "BlueSky Manufacturing",
  "Apex Goods",
  "Nimbus Labs",
  "Trident Works",
  "Summit Creations",
  "Urban Foundry",
];

const countries = [
  "India",
  "Vietnam",
  "China",
  "Indonesia",
  "Malaysia",
  "Thailand",
  "Germany",
  "United States",
  "Italy",
  "United Kingdom",
];

const netQuantities = [
  "1 Unit",
  "2 Units",
  "3 Units",
  "4 Units",
  "5 Units",
  "250 g",
  "500 g",
  "750 g",
  "1 Kg",
  "500 ml",
  "750 ml",
  "1 L",
];

const randomFromArray = (array) =>
  array[Math.floor(Math.random() * array.length)];

const randomDimension = () => {
  const randomValue = () => (Math.random() * 40 + 5).toFixed(1);
  return `${randomValue()} x ${randomValue()} x ${randomValue()} cm`;
};

const randomAsin = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let asin = "";
  for (let i = 0; i < 10; i += 1) {
    asin += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return asin;
};

const resolveModelNumber = (product) => {
  if (product.sku) return product.sku;
  if (product.title) {
    const cleanTitle = product.title
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 6);
    if (cleanTitle.length >= 4) {
      return `${cleanTitle}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }
  return `MDL-${Math.floor(100000 + Math.random() * 900000)}`;
};

const run = async () => {
  await connectDatabase();

  try {
    const products = await Product.find({}, { _id: 1, title: 1, sku: 1 })
      .lean()
      .exec();
    console.log(`Found ${products.length} products.`);

    if (!products.length) {
      console.log("No products found. Nothing to populate.");
      return;
    }

    const operations = products.map((product) => {
      const detailPayload = {
        manufacturer: randomFromArray(manufacturers),
        countryOfOrigin: randomFromArray(countries),
        itemModelNumber: resolveModelNumber(product),
        productDimensions: randomDimension(),
        asin: randomAsin(),
        netQuantity: randomFromArray(netQuantities),
      };

      return {
        updateOne: {
          filter: { product: product._id },
          update: {
            $setOnInsert: {
              product: product._id,
              ...detailPayload,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await ProductDetail.bulkWrite(operations, {
      ordered: false,
    });
    console.log("Bulk write result:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
  } catch (error) {
    console.error("Failed to populate product details:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

run();
