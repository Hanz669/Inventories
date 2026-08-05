import { mysqlTable, varchar, int, decimal, timestamp, mysqlEnum } from "drizzle-orm/mysql-core"

// 1. Tabel Users
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["ADMIN", "STAFF"]).notNull().default("STAFF"),
  createdAt: timestamp("created_at").defaultNow(),
})

// 2. Tabel Categories
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull(),
})

// 3. Tabel Products
export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: varchar("category_id", { length: 36 }).references(() => categories.id),
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
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  txCode: varchar("tx_code", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["IN", "OUT", "ADJUSTMENT"]).notNull(),
  notes: varchar("notes", { length: 255 }),
  txDate: timestamp("tx_date").defaultNow(),
})

// 5. Tabel Stock Tx Details
export const stockTxDetails = mysqlTable("stock_tx_details", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  txId: varchar("tx_id", { length: 36 }).references(() => stockTxs.id),
  productId: varchar("product_id", { length: 36 }).references(() => products.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
})