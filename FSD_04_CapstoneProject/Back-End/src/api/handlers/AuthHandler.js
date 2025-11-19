const { validationResult } = require("express-validator");
const UserAuthenticationService = require("../../domain/services/AuthService");

/**
 * UserAuthenticationHandler
 * Handles HTTP requests for user authentication
 * Delegates business logic to UserAuthenticationService
 */
class UserAuthenticationHandler {
  constructor(authService = UserAuthenticationService) {
    this.authService = authService;
  }

  /**
   * Handle user registration request
   * POST /api/v1/auth/register-user
   */
  async handleUserRegistration(req, res) {
    try {
      // Validate request body
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors.array(),
        });
      }

      const { email, username, password, phoneNumber } = req.body;

      // Call service to register user
      const registrationResult = await this.authService.registerNewUserAccount(
        email,
        username,
        password,
        phoneNumber
      );

      // Return success response with token
      res.status(201).json({
        success: true,
        message: "User account created successfully",
        sessionToken: registrationResult.sessionToken,
        refreshToken: registrationResult.refreshToken,
        userProfile: registrationResult.userProfile,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Registration failed",
      });
    }
  }

  /**
   * Handle user login request
   * POST /api/v1/auth/authenticate
   */
  async handleUserAuthentication(req, res) {
    try {
      // Validate request body
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors.array(),
        });
      }

      const { identifier, password } = req.body;
      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: "Email or phone number is required",
        });
      }

      // Call service to authenticate user
      const authenticationResult =
        await this.authService.authenticateUserWithCredentials(
          identifier,
          password
        );

      // Return success response with token
      res.status(200).json({
        success: true,
        message: "Authentication successful",
        sessionToken: authenticationResult.sessionToken,
        refreshToken: authenticationResult.refreshToken,
        userProfile: authenticationResult.userProfile,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message || "Authentication failed",
      });
    }
  }

  /**
   * Handle session refresh request
   * POST /api/v1/auth/refresh-session
   */
  async handleSessionRefresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      // Call service to refresh session
      const refreshResult = await this.authService.refreshUserSession(
        refreshToken
      );

      res.status(200).json({
        success: true,
        message: "Session refreshed successfully",
        sessionToken: refreshResult.sessionToken,
        refreshToken: refreshResult.refreshToken,
      });
    } catch (error) {
      res.status(403).json({
        success: false,
        message: error.message || "Session refresh failed",
      });
    }
  }

  /**
   * Handle user logout request
   * POST /api/v1/auth/terminate-session
   */
  async handleSessionTermination(req, res) {
    try {
      const userId = req.user.userId; // From authentication middleware

      // Call service to logout user
      await this.authService.terminateUserSession(userId);

      res.status(200).json({
        success: true,
        message: "Session terminated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Logout failed",
      });
    }
  }

  async handlePasswordResetRequest(req, res) {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors.array(),
        });
      }

      const { identifier } = req.body;
      const result = await this.authService.requestPasswordReset(identifier);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Unable to process reset request",
      });
    }
  }

  async handlePasswordReset(req, res) {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors.array(),
        });
      }

      const { token, password } = req.body;
      const result = await this.authService.resetPasswordWithToken(
        token,
        password
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Unable to reset password",
      });
    }
  }

  async handlePasswordChange(req, res) {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors.array(),
        });
      }

      const { userId, newPassword } = req.body;
      const result = await this.authService.changePassword(userId, newPassword);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Unable to update password",
      });
    }
  }
}

module.exports = new UserAuthenticationHandler();
