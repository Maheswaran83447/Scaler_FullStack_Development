const UserAccount = require("../entities/User");

/**
 * UserAccountRepository
 * Data access layer for user account operations
 * Handles all database interactions related to users
 */
class UserAccountRepository {
  /**
   * Find user by unique ID
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<object>} User account document
   */
  async findUserById(userId, options = {}) {
    const query = UserAccount.findById(userId);
    if (options.includePassword) {
      query.select("+passwordHash");
    }
    return await query;
  }

  /**
   * Find user by email address
   * @param {string} email - User email (case-insensitive)
   * @returns {Promise<object|null>} User account or null
   */
  async findUserByEmail(email, options = {}) {
    const query = UserAccount.findOne({ email: email.toLowerCase() });
    if (options.includePassword) {
      query.select("+passwordHash");
    }
    return await query;
  }

  /**
   * Find user by username
   * @param {string} username - User username
   * @returns {Promise<object|null>} User account or null
   */
  async findUserByUsername(username, options = {}) {
    const query = UserAccount.findOne({ username });
    if (options.includePassword) {
      query.select("+passwordHash");
    }
    return await query;
  }

  /**
   * Find user by phone number
   * @param {string} phoneNumber - User phone number (string)
   * @param {object} options - Query options
   * @returns {Promise<object|null>} User account or null
   */
  async findUserByPhoneNumber(phoneNumber, options = {}) {
    if (!phoneNumber) return null;
    const normalized = phoneNumber.replace(/\s+/g, "");
    const query = UserAccount.findOne({ phoneNumber: normalized });
    if (options.includePassword) {
      query.select("+passwordHash");
    }
    return await query;
  }

  /**
   * Find user by email or phone identifier (used for login)
   * @param {string} identifier - Email address or phone number
   * @returns {Promise<object|null>} User account or null
   */
  async findUserByIdentifier(identifier) {
    if (!identifier) return null;

    const isEmail = /@/.test(identifier);
    if (isEmail) {
      return this.findUserByEmail(identifier, { includePassword: true });
    }

    return await this.findUserByPhoneNumber(identifier, {
      includePassword: true,
    });
  }

  /**
   * Create new user account
   * @param {object} userAccountData - User data to create
   * @returns {Promise<object>} Created user document
   */
  async createUserRecord(userAccountData) {
    const normalizedData = { ...userAccountData };
    if (normalizedData.email) {
      normalizedData.email = normalizedData.email.toLowerCase();
    }
    if (normalizedData.phoneNumber) {
      normalizedData.phoneNumber = normalizedData.phoneNumber.replace(
        /\s+/g,
        ""
      );
    }
    const userAccount = new UserAccount(normalizedData);
    return await userAccount.save();
  }

  /**
   * Update existing user account
   * @param {string} userId - User ID to update
   * @param {object} updateData - Fields to update
   * @returns {Promise<object>} Updated user document
   */
  async updateUserRecord(userId, updateData) {
    return await UserAccount.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
  }

  /**
   * Delete user account (soft or hard delete)
   * @param {string} userId - User ID to delete
   * @returns {Promise<object>} Deleted user document
   */
  async deleteUserRecord(userId) {
    return await UserAccount.findByIdAndDelete(userId);
  }

  async setPasswordResetToken(userId, tokenHash, expiresAt) {
    return await UserAccount.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: expiresAt,
      },
      { new: true }
    );
  }

  async clearPasswordResetToken(userId) {
    return await UserAccount.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      { new: true }
    );
  }

  async findUserByPasswordResetToken(tokenHash) {
    if (!tokenHash) return null;
    return await UserAccount.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordHash +passwordResetToken +passwordResetExpires");
  }

  /**
   * Retrieve multiple users with filtering and pagination
   * @param {object} filterCriteria - MongoDB filter object
   * @param {number} pageNumber - Page number (1-indexed)
   * @param {number} pageSize - Items per page
   * @returns {Promise<array>} Array of user documents
   */
  async findUsersByFilters(filterCriteria = {}, pageNumber = 1, pageSize = 10) {
    const skipCount = (pageNumber - 1) * pageSize;
    return await UserAccount.find(filterCriteria)
      .skip(skipCount)
      .limit(pageSize)
      .lean();
  }

  /**
   * Count users matching filter criteria
   * @param {object} filterCriteria - MongoDB filter object
   * @returns {Promise<number>} Total count of matching users
   */
  async countUsersByFilters(filterCriteria = {}) {
    return await UserAccount.countDocuments(filterCriteria);
  }

  /**
   * Check if email already exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if exists, false otherwise
   */
  async doesEmailExist(email) {
    const count = await UserAccount.countDocuments({
      email: email.toLowerCase(),
    });
    return count > 0;
  }

  /**
   * Check if username already exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if exists, false otherwise
   */
  async doesUsernameExist(username) {
    const count = await UserAccount.countDocuments({ username });
    return count > 0;
  }

  /**
   * Check if phone number already exists
   * @param {string} phoneNumber - Phone number to check
   * @returns {Promise<boolean>} True if exists, false otherwise
   */
  async doesPhoneNumberExist(phoneNumber) {
    if (!phoneNumber) return false;
    const normalized = phoneNumber.replace(/\s+/g, "");
    const count = await UserAccount.countDocuments({ phoneNumber: normalized });
    return count > 0;
  }
}

module.exports = new UserAccountRepository();
