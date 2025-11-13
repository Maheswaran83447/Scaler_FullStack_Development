const UserAccount = require("../entities/UserAccount");

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
  async findUserById(userId) {
    return await UserAccount.findById(userId);
  }

  /**
   * Find user by email address
   * @param {string} email - User email (case-insensitive)
   * @returns {Promise<object|null>} User account or null
   */
  async findUserByEmail(email) {
    return await UserAccount.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by username
   * @param {string} username - User username
   * @returns {Promise<object|null>} User account or null
   */
  async findUserByUsername(username) {
    return await UserAccount.findOne({ username });
  }

  /**
   * Create new user account
   * @param {object} userAccountData - User data to create
   * @returns {Promise<object>} Created user document
   */
  async createUserRecord(userAccountData) {
    const userAccount = new UserAccount(userAccountData);
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
}

module.exports = new UserAccountRepository();
