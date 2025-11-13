import apiClient from "./apiClient";

export const authService = {
  async register(email, username, password) {
    try {
      const response = await apiClient.post("/auth/register", {
        email,
        username,
        password,
      });
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw new Error(error.message || "Registration failed");
    }
  },

  async login(email, password) {
    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  },

  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("accessToken");
  },
};

export default authService;
