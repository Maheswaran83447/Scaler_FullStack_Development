const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * UserAccount Schema
 * Represents a user account in the system
 * Includes authentication credentials, profile info, and account status
 */
const userAccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    userRole: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    profileAvatarUrl: {
      type: String,
      default: null,
    },
    accountCreatedAt: {
      type: Date,
      default: Date.now,
    },
    lastAuthenticatedAt: {
      type: Date,
      default: null,
    },
    lastSessionTerminatedAt: {
      type: Date,
      default: null,
    },
    isAccountActive: {
      type: Boolean,
      default: true,
    },
    emailVerificationStatus: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenExpiry: {
      type: Date,
      default: null,
    },
    accountUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: {
      createdAt: "accountCreatedAt",
      updatedAt: "accountUpdatedAt",
    },
  }
);

/**
 * Pre-save hook: Hash password before storing
 * Only runs if password is modified
 */
userAccountSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method: Compare plaintext password with hash
 * @param {string} rawPassword - Plaintext password to compare
 * @returns {Promise<boolean>} True if password matches
 */
userAccountSchema.methods.comparePasswordHash = async function (rawPassword) {
  return await bcrypt.compare(rawPassword, this.passwordHash);
};

/**
 * Instance method: Convert user to JSON (exclude sensitive fields)
 * @returns {object} User profile without password
 */
userAccountSchema.methods.toUserProfileJSON = function () {
  const userProfile = this.toObject();
  delete userProfile.passwordHash;
  delete userProfile.emailVerificationTokenExpiry;
  delete userProfile.passwordResetToken;
  delete userProfile.passwordResetExpires;
  return userProfile;
};

/**
 * Instance method: Get user display name
 * @returns {string} Full name or username
 */
userAccountSchema.methods.getDisplayName = function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
};

// Create and export the model
const UserAccount = mongoose.model("UserAccount", userAccountSchema);

module.exports = UserAccount;
