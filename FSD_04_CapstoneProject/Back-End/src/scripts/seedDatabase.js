require("dotenv").config();
const { connectDatabase } = require("../infrastructure/database/connection");
const Product = require("../domain/entities/Product");

// Utility helpers
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Category / subcategory definitions
const catalog = {
  Dress: {
    groups: ["Men", "Women", "Children"],
    sub: {
      Men: [
        "Trousers",
        "Shirts",
        "T-Shirts",
        "Joggers",
        "Jeans",
        "Shorts",
        "3/4",
        "Sandals",
        "Shoes",
        "Sneakers",
      ],
      Women: [
        "Kurtis",
        "Sarees",
        "Pyjamas",
        "Heels",
        "Sandals",
        "Dresses",
        "Top",
        "Skirts",
        "Leggings",
        "Cosmetics",
      ],
      Children: [
        "Kids T-Shirt",
        "Kids Shorts",
        "Kids Dresses",
        "Kids Sandals",
        "Kids Sneakers",
      ],
    },
  },
  Electronics: {
    groups: ["General"],
    sub: {
      General: [
        "Phones",
        "Tablets",
        "Monitors",
        "PC",
        "Gaming Console",
        "Powerbank",
        "Earbuds",
        "Headphones",
        "Speakers",
        "Camera",
      ],
    },
  },
  "Veg & Fruits": {
    groups: ["Produce"],
    sub: {
      Produce: [
        "Apple",
        "Banana",
        "Mango",
        "Orange",
        "Grapes",
        "Pomegranate",
        "Papaya",
        "Pineapple",
        "Pear",
        "Watermelon",
        "Tomato",
        "Potato",
        "Onion",
        "Cucumber",
        "Carrot",
        "Spinach",
        "Lemon",
        "Ginger",
        "Garlic",
        "Green Chilli",
      ],
    },
  },
  Appliances: {
    groups: ["Home"],
    sub: {
      Home: [
        "Refrigerator",
        "Washing Machine",
        "Microwave",
        "Air Conditioner",
        "Water Purifier",
        "Mixer Grinder",
        "Iron",
        "Vacuum Cleaner",
      ],
    },
  },
};

const adjectives = [
  "Premium",
  "Classic",
  "Comfort",
  "Deluxe",
  "Eco",
  "Smart",
  "Budget",
  "Limited Edition",
  "Pro",
  "Ultra",
];
const electronicsBrands = [
  "ZenTek",
  "Nova",
  "Orbit",
  "Zenith",
  "Astra",
  "Pulse",
  "Byte",
  "Core",
  "Lumen",
  "Volt",
];
const dressBrands = [
  "UrbanStyle",
  "Heritage",
  "Couture",
  "DailyWear",
  "ComfortFit",
  "TrendZone",
];

const makeTitle = (category, sub, group) => {
  if (category === "Electronics") {
    const brand = pick(electronicsBrands);
    const model = `${brand} ${
      Math.floor(Math.random() * 900) + 100
    }${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    return `${pick(adjectives)} ${sub} ${model}`;
  }

  if (category === "Veg & Fruits") {
    // Use sub as the fruit/veg name
    return `${sub} - Fresh (1 Kg)`;
  }

  // Dress / Appliances
  const brand = pick(dressBrands);
  return `${brand} ${sub} ${pick(adjectives)}`;
};

const priceFor = (category) => {
  switch (category) {
    case "Dress":
      return randInt(299, 4999); // INR
    case "Electronics":
      return randInt(999, 79999);
    case "Veg & Fruits":
      return randInt(20, 400);
    case "Appliances":
      return randInt(1500, 40000);
    default:
      return randInt(100, 5000);
  }
};

const generateProducts = (count = 1000) => {
  const cats = Object.keys(catalog);
  const products = [];

  for (let i = 0; i < count; i++) {
    const category = pick(cats);
    const group = pick(catalog[category].groups);
    const subArr =
      catalog[category].sub[group] ||
      catalog[category].sub[Object.keys(catalog[category].sub)[0]];
    const sub = pick(subArr);

    const title = makeTitle(category, sub, group);
    const description = `High quality ${sub} from ${group} collection. Ideal choice for everyday use and special occasions.`;
    const price = priceFor(category);
    const stock = randInt(0, 200);
    const sku = `${category.substring(0, 3).toUpperCase()}-${String(
      i + 1
    ).padStart(5, "0")}`;

    products.push({
      title,
      description,
      price,
      category,
      images: [],
      stock,
      sku,
      tags: [category, group, sub],
    });
  }

  return products;
};

const seed = async () => {
  try {
    await connectDatabase();
    console.log(
      "Seeding products... (this may take a few seconds for 1000 items)"
    );
    await Product.deleteMany({});

    const toInsert = generateProducts(1000);
    // Insert in batches of 200 to avoid extremely large single insert
    const batchSize = 200;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      await Product.insertMany(batch);
      console.log(`Inserted ${i + batch.length}/${toInsert.length}`);
    }

    console.log("Seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seed();
