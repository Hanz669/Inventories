import { fetchClient } from "./client";
import { User } from "../../types";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
  role?: "ADMIN" | "STAFF";
}

export interface AuthResponse extends User {
  token: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return fetchClient<AuthResponse>("/auth/login", { data: credentials });
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    return fetchClient<User>("/auth/register", { data: credentials });
  },

  getMe: async (): Promise<User> => {
    return fetchClient<User>("/auth/me");
  },
};
