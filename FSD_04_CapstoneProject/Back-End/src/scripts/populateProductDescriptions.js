require("dotenv").config();
const mongoose = require("mongoose");
const { connectDatabase } = require("../infrastructure/database/connection");
const Product = require("../domain/entities/Product");
const ProductDescription = require("../domain/entities/ProductDescription");

const pickCategoryDescriptor = (category = "") => {
  if (!category) return "everyday essentials";
  const lowered = category.toLowerCase();
  if (lowered.includes("fashion") || lowered.includes("dress")) {
    return "fashion-forward apparel";
  }
  if (lowered.includes("home")) {
    return "home and lifestyle upgrades";
  }
  if (lowered.includes("fresh") || lowered.includes("grocery")) {
    return "fresh pantry staples";
  }
  if (lowered.includes("electronics")) {
    return "next-gen electronics";
  }
  if (lowered.includes("appliance")) {
    return "high-efficiency appliances";
  }
  if (lowered.includes("beauty")) {
    return "self-care and beauty must-haves";
  }
  return `${category} essentials`;
};

const baseBulletTemplates = [
  (title, categoryDescriptor) =>
    `${title} delivers a refined build quality that feels tailored for ${categoryDescriptor}.`,
  (title) =>
    `Precision-tested materials make ${title} reliable for both weekday routines and weekend adventures.`,
  (title) =>
    `${title} integrates seamlessly with your existing Cartify ecosystem, unlocking effortless daily workflows.`,
  (title) =>
    `The ergonomic profile of ${title} ensures comfort, balance, and confidence with every interaction.`,
  (title) =>
    `${title} ships with Cartify Care support, ensuring you always have expert guidance a tap away.`,
  (title) =>
    `Thoughtful detailing on ${title} keeps it looking new, even after months of enthusiastic use.`,
  (title) =>
    `Smart packaging for ${title} is fully recyclable, helping keep your sustainable commitments on track.`,
];

const shuffleArray = (input) => {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const supportingParagraphs = [
  (title, category, seller) =>
    `Crafted for modern living, the ${title} from ${seller} arrives ready to elevate your ${category} collection. Our in-house team obsessively tuned the texture, balance, and performance, so the moment you unpack it you feel the Cartify difference.`,
  (title, category) =>
    `Every element of the ${title} has been thoughtfully engineered. From its responsive controls to its calming finishes, it fits right into ${category} setups without demanding extra effort or accessories.`,
  (title) =>
    `We partnered with trusted manufacturing labs to run multiple durability cycles on the ${title}. The result is a product that shrugs off everyday scuffs, sustains colour vibrancy, and maintains structural integrity through the seasons.`,
  (title) =>
    `During development we mapped thousands of customer reviews to define what "premium" feels like. The ${title} responds with intuitive gestures, generous storage, and quick clean-ups that honour your time.`,
  (title) =>
    `Pair the ${title} with other Cartify exclusives to build a cohesive look. Layer it with textured throws, ambient lighting, or sleek smart accessories to unlock a space that feels personal yet future-ready.`,
  (title) =>
    `For customers who value mindful living, the ${title} keeps maintenance simple. Every component can be refreshed with a gentle wipe, while the modular design enables upgrades rather than replacement.`,
  (title) =>
    `Because we believe premium experiences should be inclusive, the ${title} follows strict ergonomics guidelines, ensuring comfortable handling whether you are starting your day or winding down.`,
];

const ambienceSnippets = [
  "Set an ambient playlist, brew your favourite beverage, and let the product unfold its immersive story.",
  "Blend tactile comfort with mindful aesthetics, so your space feels curated yet effortless.",
  "Design-led surfaces diffuse light softly, turning any corner into an inspiring vignette.",
  "Engineered airflow and thermal balance keep the product serene during extended sessions.",
  "Cartify stylists recommend pairing with neutral accents to let the hero piece command attention.",
];

const closingSentiments = [
  (title) =>
    `Bring the ${title} home and experience the Cartify promise: premium materials, mindful design, and outstanding support just a message away.`,
  (title) =>
    `With the ${title}, every interaction blends ease and delight, reminding you that thoughtful design can be a daily ritual.`,
  (title) =>
    `Reserve your ${title} today, and step into a world where form, function, and feeling blend seamlessly.`,
];

const countWords = (html = "") => {
  const text = html.replace(/<[^>]+>/g, " ");
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;
};

const buildDescription = (product) => {
  const title = product.title || "Cartify Product";
  const seller = product.sellerName || product.brand || "Cartify Marketplace";
  const categoryDescriptor = pickCategoryDescriptor(product.category);

  const selectedBullets = shuffleArray(baseBulletTemplates)
    .slice(0, 5)
    .map((builder) => builder(title, categoryDescriptor));

  const paragraphGenerators = shuffleArray(supportingParagraphs);
  const paragraphs = [];
  while (paragraphs.length < 5 && paragraphGenerators.length) {
    const generator = paragraphGenerators.shift();
    const paragraph = generator(title, categoryDescriptor, seller);
    paragraphs.push(paragraph);
  }

  const ambienceParagraph = `${title} resonates in curated environments. ${
    ambienceSnippets[Math.floor(Math.random() * ambienceSnippets.length)]
  }`;

  const closingParagraph =
    closingSentiments[Math.floor(Math.random() * closingSentiments.length)](
      title
    );

  const paragraphHtml = paragraphs.map((text) => `<p>${text}</p>`).join("");

  let html = [
    paragraphHtml,
    `<ul>${selectedBullets
      .map((bullet) => `<li>${bullet}</li>`)
      .join("")}</ul>`,
    `<p>${ambienceParagraph}</p>`,
    `<p>${closingParagraph}</p>`,
  ].join("");

  let wordCount = countWords(html);
  const fillerSentence = `${title} keeps pace with your ambitions, delivering consistent performance, inviting textures, and moments of calm reflection throughout the day.`;

  while (wordCount < 520) {
    html += `<p>${fillerSentence}</p>`;
    wordCount = countWords(html);
  }

  return { html: html.replace(/\s{2,}/g, " "), wordCount };
};

const run = async () => {
  await connectDatabase();

  try {
    const products = await Product.find(
      {},
      { _id: 1, title: 1, category: 1, brand: 1 }
    )
      .lean()
      .exec();

    if (!products.length) {
      console.log("No products found. Nothing to populate.");
      return;
    }

    console.log(`Preparing descriptions for ${products.length} products.`);

    const operations = products.map((product) => {
      const { html, wordCount } = buildDescription(product);
      return {
        updateOne: {
          filter: { product: product._id },
          update: {
            $set: {
              descriptionHtml: html,
              wordCount,
            },
            $setOnInsert: { product: product._id },
          },
          upsert: true,
        },
      };
    });

    const result = await ProductDescription.bulkWrite(operations, {
      ordered: false,
    });

    console.log("Bulk description population complete:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
  } catch (error) {
    console.error("Failed to populate product descriptions:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

run();
