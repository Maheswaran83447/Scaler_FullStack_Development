import { useState, useCallback } from "react";
import authService from "../services/authService";

export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = useCallback(async (email, username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(email, username, password);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const loginAsGuest = useCallback(() => {
    const guest = { name: "Guest", id: "guest" };
    setUser(guest);
    return guest;
  }, []);

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    loginAsGuest,
    isAuthenticated: !!user,
  };
};

export default useAuth;
