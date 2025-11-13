const jwt = require("jsonwebtoken");
const UserAccountRepository = require("../repositories/UserAccountRepository");

/**
 * UserAuthenticationService
 * Handles all user authentication business logic
 * - New user registration
 * - User credential validation
 * - Session token generation
 */
class UserAuthenticationService {
  constructor(userRepository = UserAccountRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Register a new user account
   * @param {string} email - User email address
   * @param {string} username - User chosen username
   * @param {string} password - User password (will be hashed)
   * @returns {object} { sessionToken, userProfile }
   * @throws {Error} If email or username already exists
   */
  async registerNewUserAccount(email, username, password) {
    // Check if email is already registered
    const existingUserByEmail = await this.userRepository.findUserByEmail(
      email
    );
    if (existingUserByEmail) {
      throw new Error("Email address is already registered");
    }

    // Check if username is available
    const existingUserByUsername = await this.userRepository.findUserByUsername(
      username
    );
    if (existingUserByUsername) {
      throw new Error("Username is already taken, please choose another");
    }

    // Prepare user account data
    const newUserAccountData = {
      email,
      username,
      passwordHash: password,
      accountCreatedAt: new Date(),
      emailVerificationStatus: false,
    };

    // Create user in database
    const newUserAccount = await this.userRepository.createUserRecord(
      newUserAccountData
    );

    // Generate authentication tokens
    return this._generateSessionTokens(newUserAccount);
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {object} { sessionToken, userProfile }
   * @throws {Error} If user not found or password invalid
   */
  async authenticateUserWithCredentials(email, password) {
    // Find user by email
    const userAccount = await this.userRepository.findUserByEmail(email);
    if (!userAccount) {
      throw new Error("User account not found");
    }

    // Validate password against stored hash
    const isPasswordCorrect = await userAccount.comparePasswordHash(password);
    if (!isPasswordCorrect) {
      throw new Error("Password is incorrect");
    }

    // Update last authentication timestamp
    const updatedUserAccount = await this.userRepository.updateUserRecord(
      userAccount._id,
      {
        lastAuthenticatedAt: new Date(),
      }
    );

    // Generate new session tokens
    return this._generateSessionTokens(updatedUserAccount);
  }

  /**
   * Verify and refresh authentication token
   * @param {string} refreshToken - Refresh token from client
   * @returns {object} { sessionToken, userProfile }
   * @throws {Error} If token is invalid or expired
   */
  async refreshUserSession(refreshToken) {
    try {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );

      const userAccount = await this.userRepository.findUserById(
        decodedToken.userId
      );
      if (!userAccount) {
        throw new Error("User account no longer exists");
      }

      return this._generateSessionTokens(userAccount);
    } catch (error) {
      throw new Error("Session refresh failed: " + error.message);
    }
  }

  /**
   * Private helper: Generate JWT tokens for authenticated user
   * @private
   * @param {object} userAccount - User document from database
   * @returns {object} { sessionToken, refreshToken, userProfile }
   */
  _generateSessionTokens(userAccount) {
    const sessionToken = jwt.sign(
      {
        userId: userAccount._id,
        email: userAccount.email,
        userRole: userAccount.userRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    const refreshToken = jwt.sign(
      { userId: userAccount._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    return {
      success: true,
      sessionToken,
      refreshToken,
      userProfile: userAccount.toUserProfileJSON(),
    };
  }

  /**
   * Logout user (invalidate session)
   * Note: Full logout requires token blacklist on server
   * @param {string} userId - User ID to logout
   */
  async terminateUserSession(userId) {
    // Update last logout timestamp
    await this.userRepository.updateUserRecord(userId, {
      lastSessionTerminatedAt: new Date(),
    });
    return { success: true, message: "Session terminated successfully" };
  }
}

module.exports = new UserAuthenticationService();
