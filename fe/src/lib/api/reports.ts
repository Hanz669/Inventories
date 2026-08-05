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
  userName?: string | null;
}

export const reportsApi = {
  getSummary: async (): Promise<ReportSummary> => {
    return fetchClient<ReportSummary>("/reports/summary");
  },

  getLowStock: async (): Promise<LowStockProduct[]> => {
    return fetchClient<LowStockProduct[]>("/reports/low-stock");
  },

  getTransactionsSummary: async (period?: string, startDate?: string, endDate?: string): Promise<TransactionSummary[]> => {
    let url = "/reports/transactions-summary";
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    return fetchClient<TransactionSummary[]>(url);
  },

  getTransactionsDetail: async (period?: string, startDate?: string, endDate?: string): Promise<TransactionDetail[]> => {
    let url = "/reports/transactions-detail";
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    return fetchClient<TransactionDetail[]>(url);
  },
};
