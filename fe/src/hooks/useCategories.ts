import { useState, useEffect, useCallback } from "react";
import { categoriesApi } from "../lib/api/categories";
import { Category } from "../types";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string) => {
    try {
      await categoriesApi.create({ name });
      await fetchCategories();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to create category");
      return false;
    }
  };

  const updateCategory = async (id: number, name: string) => {
    try {
      await categoriesApi.update(id, { name });
      await fetchCategories();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update category");
      return false;
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await categoriesApi.delete(id);
      await fetchCategories();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
      return false;
    }
  };

  return { 
    categories, 
    isLoading, 
    error, 
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
