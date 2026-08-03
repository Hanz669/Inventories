import { mysqlTable, varchar, int, decimal, timestamp, mysqlEnum } from "drizzle-orm/mysql-core"

// 1. Tabel Users
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["ADMIN", "STAFF"]).notNull().default("STAFF"),
  createdAt: timestamp("created_at").defaultNow(),
})

// 2. Tabel Categories
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
})

// 3. Tabel Products
export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  categoryId: int("category_id").references(() => categories.id),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  stock: int("stock").notNull().default(0),
  minStock: int("min_stock").notNull().default(5),
  buyPrice: decimal("buy_price", { precision: 12, scale: 2 }).notNull(),
  sellPrice: decimal("sell_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// 4. Tabel Stock Txs
export const stockTxs = mysqlTable("stock_txs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id),
  txCode: varchar("tx_code", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["IN", "OUT", "ADJUSTMENT"]).notNull(),
  notes: varchar("notes", { length: 255 }),
  txDate: timestamp("tx_date").defaultNow(),
})

// 5. Tabel Stock Tx Details
export const stockTxDetails = mysqlTable("stock_tx_details", {
  id: int("id").primaryKey().autoincrement(),
  txId: int("tx_id").references(() => stockTxs.id),
  productId: int("product_id").references(() => products.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
})