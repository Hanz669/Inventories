import { useState, useEffect } from "react";
import { authApi, LoginCredentials, RegisterCredentials } from "../lib/api/auth";
import { User } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (err: any) {
          localStorage.removeItem("token");
          setError("Session expired. Please login again.");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      localStorage.setItem("token", res.token);
      setUser({
        id: res.id,
        name: res.name,
        email: res.email,
        role: res.role,
        createdAt: res.createdAt,
      });
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to login");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(credentials);
      // Registration successful, but token is not returned
      // The user will need to log in now. We return true to indicate success.
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to register");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return { user, isLoading, error, login, register, logout };
};
