const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserAccountRepository = require("../repositories/UserRepository");
const EmailService = require("../../infrastructure/services/EmailService");

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
  async registerNewUserAccount(email, username, password, phoneNumber) {
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

    if (phoneNumber) {
      const phoneNumberInUse = await this.userRepository.doesPhoneNumberExist(
        phoneNumber
      );
      if (phoneNumberInUse) {
        throw new Error("Phone number is already linked to an account");
      }
    }

    // Prepare user account data
    const newUserAccountData = {
      email,
      username,
      passwordHash: password,
      phoneNumber,
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
  async authenticateUserWithCredentials(identifier, password) {
    // Find user by email or phone
    const userAccount = await this.userRepository.findUserByIdentifier(
      identifier
    );
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
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
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

  async requestPasswordReset(identifier) {
    if (!identifier) {
      throw new Error("Email or phone number is required");
    }

    const user = await this.userRepository.findUserByIdentifier(identifier);
    if (!user) {
      return {
        success: true,
        message:
          "If an account exists for the provided details, a reset link has been sent",
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.setPasswordResetToken(
      user._id,
      tokenHash,
      expiresAt
    );

    const frontendBase =
      process.env.FRONTEND_BASE_URL || "http://localhost:5173";
    const resetLink = `${frontendBase.replace(
      /\/$/,
      ""
    )}/reset-password?token=${resetToken}`;

    await EmailService.sendPasswordResetEmail(user.email, resetLink);

    return {
      success: true,
      message: "Password reset instructions have been sent to your email",
    };
  }

  async resetPasswordWithToken(token, newPassword) {
    if (!token) {
      throw new Error("Reset token is required");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await this.userRepository.findUserByPasswordResetToken(
      tokenHash
    );

    if (!user) {
      throw new Error("Reset link is invalid or has expired");
    }

    user.passwordHash = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return {
      success: true,
      message: "Password updated successfully",
    };
  }

  async changePassword(userId, newPassword) {
    if (!userId) {
      throw new Error("User ID is required to update password");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const user = await this.userRepository.findUserById(userId, {
      includePassword: true,
    });

    if (!user) {
      throw new Error("User account not found");
    }

    user.passwordHash = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return {
      success: true,
      message: "Password updated successfully",
    };
  }
}

module.exports = new UserAuthenticationService();
