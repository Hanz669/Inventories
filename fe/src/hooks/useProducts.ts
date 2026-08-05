import { useState, useEffect, useCallback } from "react";
import { productsApi } from "../lib/api/products";
import { Product } from "../types";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meta, setMeta] = useState<any>(null);

  const fetchProducts = useCallback(async (params?: { page?: number; limit?: number; search?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getAll(params);
      setProducts(data.items);
      setMeta(data.meta);
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: Partial<Product>) => {
    try {
      await productsApi.create(data);
      await fetchProducts();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      return false;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      await productsApi.update(id, data);
      await fetchProducts();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update product");
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productsApi.delete(id);
      await fetchProducts();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
      return false;
    }
  };

  return { 
    products, 
    meta,
    isLoading, 
    error, 
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};
