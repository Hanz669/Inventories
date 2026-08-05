import { fetchClient } from "./client";
import { Product } from "../../types";

export const productsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<{items: Product[], meta: any}> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : "/products";
    return fetchClient<{items: Product[], meta: any}>(endpoint);
  },

  getById: async (id: string): Promise<Product> => {
    return fetchClient<Product>(`/products/${id}`);
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    return fetchClient<Product>("/products", { data });
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    return fetchClient<Product>(`/products/${id}`, {
      method: "PUT",
      data,
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchClient<void>(`/products/${id}`, { method: "DELETE" });
  },
};
