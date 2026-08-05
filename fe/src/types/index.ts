export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  categoryId: string | null;
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
  id: string;
  userId: string | null;
  txCode: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  notes?: string | null;
  txDate: string;
  user?: User; // Optional if joined
}

export interface StockTxDetail {
  id: string;
  txId: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  product?: Product; // Optional if joined
}
