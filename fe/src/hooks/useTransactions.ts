import { useState, useEffect, useCallback } from "react";
import { transactionsApi, CreateTransactionPayload } from "../lib/api/transactions";
import { StockTx } from "../types";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<StockTx[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.getAll();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (data: CreateTransactionPayload) => {
    try {
      await transactionsApi.create(data);
      await fetchTransactions();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to create transaction");
      return false;
    }
  };

  return { transactions, isLoading, error, refetch: fetchTransactions, createTransaction };
};
