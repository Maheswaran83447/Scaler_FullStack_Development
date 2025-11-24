require("dotenv").config();
const mongoose = require("mongoose");
const { connectDatabase } = require("../infrastructure/database/connection");
const UserAccount = require("../domain/entities/User");
const UserAddress = require("../domain/entities/UserAddress");

const locations = [
  { city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
  { city: "New Delhi", state: "Delhi", pincode: "110001" },
  { city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
  { city: "Hyderabad", state: "Telangana", pincode: "500081" },
  { city: "Pune", state: "Maharashtra", pincode: "411001" },
  { city: "Kolkata", state: "West Bengal", pincode: "700001" },
  { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
  { city: "Chandigarh", state: "Chandigarh", pincode: "160017" },
];

const streets = [
  "MG Road",
  "Brigade Road",
  "Residency Road",
  "Linking Road",
  "Park Street",
  "ITPL Main Road",
  "Gachibowli Road",
  "Anna Salai",
  "FC Road",
  "Salt Lake Boulevard",
];

const landmarks = [
  "City Mall",
  "Metro Station",
  "Community Park",
  "Tech Park",
  "Lakeside Promenade",
  "Botanical Garden",
  "Central Library",
  "Sports Arena",
  "Heritage Plaza",
  "Food Street",
];

const secondaryLabels = [
  { label: "Work", tag: "work" },
  { label: "Parents", tag: "other" },
  { label: "Studio", tag: "other" },
  { label: "Warehouse", tag: "work" },
  { label: "Vacation Home", tag: "other" },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomHouseNumber = () => `${Math.floor(Math.random() * 350) + 25}`;

const normalizeCurrentAddress = async (userId) => {
  const addresses = await UserAddress.find({ user: userId })
    .sort({ createdAt: 1 })
    .lean();

  if (!addresses.length) return addresses;

  const currentAddresses = addresses.filter((addr) => addr.isCurrentAddress);
  const operations = [];

  if (currentAddresses.length > 1) {
    const toUnset = currentAddresses.slice(1).map((addr) => addr._id);
    operations.push(
      UserAddress.updateMany(
        { _id: { $in: toUnset } },
        { isCurrentAddress: false, isDefaultShipping: false }
      )
    );
  }

  if (!currentAddresses.length) {
    const preferred = addresses[addresses.length - 1];
    operations.push(
      UserAddress.findByIdAndUpdate(
        preferred._id,
        { isCurrentAddress: true, isDefaultShipping: true },
        { new: true }
      )
    );
  }

  if (operations.length) {
    await Promise.all(operations);
    return await UserAddress.find({ user: userId })
      .sort({ createdAt: 1 })
      .lean();
  }

  return addresses;
};

const buildAddress = ({ userId, makePrimary, overrideTag }) => {
  const location = pick(locations);
  const street = pick(streets);
  const landmark = pick(landmarks);
  const baseLabel = makePrimary
    ? { label: "Home", tag: "home" }
    : pick(secondaryLabels);
  const resolvedTag = overrideTag || baseLabel.tag;

  return {
    user: userId,
    label: baseLabel.label,
    tag: resolvedTag,
    addressLine1: `${randomHouseNumber()} ${street}`,
    addressLine2: `Near ${landmark}`,
    landmark,
    city: location.city,
    state: location.state,
    pincode: location.pincode,
    isDefaultShipping: !!makePrimary,
    isDefaultBilling: !!makePrimary,
    isCurrentAddress: !!makePrimary,
  };
};

const ensureTwoAddressesForUser = async (user) => {
  let existing = await normalizeCurrentAddress(user._id);

  if (existing.length >= 2) {
    return { skipped: true, created: 0 };
  }

  const hasCurrent = existing.some((addr) => addr.isCurrentAddress);
  const hasDefaultShipping = existing.some((addr) => addr.isDefaultShipping);
  const hasDefaultBilling = existing.some((addr) => addr.isDefaultBilling);

  const addressesToCreate = [];
  const needed = 2 - existing.length;

  for (let i = 0; i < needed; i += 1) {
    const makePrimary = !hasCurrent && i === 0;
    const address = buildAddress({ userId: user._id, makePrimary });

    if (!hasDefaultShipping && makePrimary) {
      address.isDefaultShipping = true;
    } else if (!hasDefaultShipping && !makePrimary && i === needed - 1) {
      address.isDefaultShipping = true;
      address.isCurrentAddress = true;
    }

    if (!hasDefaultBilling && makePrimary) {
      address.isDefaultBilling = true;
    }

    if (!makePrimary && address.isCurrentAddress) {
      address.isDefaultShipping = true;
    }

    addressesToCreate.push(address);
  }

  if (!addressesToCreate.length) {
    return { skipped: false, created: 0 };
  }

  await UserAddress.insertMany(addressesToCreate);
  await normalizeCurrentAddress(user._id);
  return { skipped: false, created: addressesToCreate.length };
};

const run = async () => {
  await connectDatabase();
  try {
    const users = await UserAccount.find({}, { _id: 1 }).lean().exec();
    console.log(`Found ${users.length} users to evaluate for address seeding.`);

    let createdTotal = 0;
    let skipped = 0;

    for (const user of users) {
      const { skipped: userSkipped, created } = await ensureTwoAddressesForUser(
        user
      );
      if (userSkipped) {
        skipped += 1;
      } else {
        createdTotal += created;
      }
    }

    console.log(
      `Address seeding complete. Users skipped: ${skipped}, new addresses created: ${createdTotal}.`
    );
  } catch (error) {
    console.error("Failed to populate user addresses:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

run();
