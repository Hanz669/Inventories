import { fetchClient } from "./client";
import { Product } from "../../types";

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    return fetchClient<Product[]>("/products");
  },

  getById: async (id: number): Promise<Product> => {
    return fetchClient<Product>(`/products/${id}`);
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    return fetchClient<Product>("/products", { data });
  },

  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    return fetchClient<Product>(`/products/${id}`, {
      method: "PUT",
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchClient<void>(`/products/${id}`, { method: "DELETE" });
  },
};
