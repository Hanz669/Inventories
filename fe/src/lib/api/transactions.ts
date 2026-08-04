import { fetchClient } from "./client";
import { StockTx } from "../../types";

export interface TransactionItemPayload {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateTransactionPayload {
  type: "IN" | "OUT" | "ADJUSTMENT";
  notes?: string;
  items: TransactionItemPayload[];
}

export const transactionsApi = {
  getAll: async (): Promise<StockTx[]> => {
    return fetchClient<StockTx[]>("/transactions");
  },

  getById: async (id: number): Promise<any> => { // Returns tx with items array
    return fetchClient<any>(`/transactions/${id}`);
  },

  create: async (data: CreateTransactionPayload): Promise<any> => {
    return fetchClient<any>("/transactions", { data });
  },
};
