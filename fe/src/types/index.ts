export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  categoryId: number;
  sku: string;
  name: string;
  stock: number;
  minStock: number;
  buyPrice: string | number;
  sellPrice: string | number;
  createdAt: string;
  category?: Category; // Optional if joined
}

export interface StockTx {
  id: number;
  userId: number;
  txCode: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  notes?: string | null;
  txDate: string;
  user?: User; // Optional if joined
}

export interface StockTxDetail {
  id: number;
  txId: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  product?: Product; // Optional if joined
}
