import { fetchClient } from "./client";

export interface ReportSummary {
  totalProducts: number;
  totalCategories: number;
  totalTransactions: number;
  lowStockCount: number;
  totalStockItems: number;
}

export interface LowStockProduct {
  id: number;
  sku: string;
  name: string;
  stock: number;
  minStock: number;
  buyPrice: string | number;
  sellPrice: string | number;
  categoryName: string | null;
}

export interface TransactionSummary {
  type: "IN" | "OUT" | "ADJUSTMENT";
  count: number;
}

export interface TransactionDetail {
  id: number;
  txDate: string;
  txCode: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  productName: string;
  quantity: number;
  unitPrice: string | number;
}

export const reportsApi = {
  getSummary: async (): Promise<ReportSummary> => {
    return fetchClient<ReportSummary>("/reports/summary");
  },

  getLowStock: async (): Promise<LowStockProduct[]> => {
    return fetchClient<LowStockProduct[]>("/reports/low-stock");
  },

  getTransactionsSummary: async (period?: string): Promise<TransactionSummary[]> => {
    const query = period ? `?period=${period}` : "";
    return fetchClient<TransactionSummary[]>(`/reports/transactions-summary${query}`);
  },

  getTransactionsDetail: async (period?: string): Promise<TransactionDetail[]> => {
    const query = period ? `?period=${period}` : "";
    return fetchClient<TransactionDetail[]>(`/reports/transactions-detail${query}`);
  },
};
