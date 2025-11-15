import { useState, useCallback } from "react";
import authService from "../services/authService";

export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      if (response.userProfile) {
        setUser(response.userProfile);
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      if (response.userProfile) {
        setUser(response.userProfile);
      }
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
