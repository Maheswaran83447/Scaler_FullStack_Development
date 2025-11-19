import apiClient from "./apiClient";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export const authService = {
  async register({ email, username, password, phoneNumber }) {
    try {
      const response = await apiClient.post("/api/auth/register", {
        email,
        username,
        password,
        phoneNumber,
      });

      if (response.sessionToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.sessionToken);
        if (response.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        }
        if (response.userProfile) {
          localStorage.setItem(USER_KEY, JSON.stringify(response.userProfile));
        }
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Registration failed");
    }
  },

  async login({ identifier, password }) {
    try {
      const response = await apiClient.post("/api/auth/login", {
        identifier,
        password,
      });

      if (response.sessionToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.sessionToken);
        if (response.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        }
        if (response.userProfile) {
          localStorage.setItem(USER_KEY, JSON.stringify(response.userProfile));
        }
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  },

  logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async requestPasswordReset({ identifier }) {
    try {
      return await apiClient.post("/api/auth/forgot-password", {
        identifier,
      });
    } catch (error) {
      throw new Error(error.message || "Unable to send reset email");
    }
  },

  async resetPassword({ token, password }) {
    try {
      return await apiClient.post("/api/auth/reset-password", {
        token,
        password,
      });
    } catch (error) {
      throw new Error(error.message || "Unable to reset password");
    }
  },

  async changePassword({ userId, newPassword }) {
    try {
      return await apiClient.post("/api/auth/change-password", {
        userId,
        newPassword,
      });
    } catch (error) {
      throw new Error(error.message || "Unable to update password");
    }
  },
};

export default authService;
