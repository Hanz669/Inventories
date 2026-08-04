import { fetchClient } from "./client";
import { Category } from "../../types";

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    return fetchClient<Category[]>("/categories");
  },

  getById: async (id: number): Promise<Category> => {
    return fetchClient<Category>(`/categories/${id}`);
  },

  create: async (data: { name: string }): Promise<Category> => {
    return fetchClient<Category>("/categories", { data });
  },

  update: async (id: number, data: { name: string }): Promise<Category> => {
    return fetchClient<Category>(`/categories/${id}`, {
      method: "PUT",
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchClient<void>(`/categories/${id}`, { method: "DELETE" });
  },
};
