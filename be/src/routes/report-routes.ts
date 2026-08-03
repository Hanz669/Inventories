import { Hono } from "hono"
import { eq, lte, sql } from "drizzle-orm"
import { db } from "../db/index.js"
import { categories, products, stockTxs } from "../db/schema.js"
import { authMiddleware, type Env } from "./auth.js"

const reportRoutes = new Hono<Env>()

reportRoutes.use("*", authMiddleware)

reportRoutes.get("/summary", async (c) => {
  try {
    const [productCountResult] = await db.select({ count: sql<number>`count(*)` }).from(products)
    const [categoryCountResult] = await db.select({ count: sql<number>`count(*)` }).from(categories)
    const [txCountResult] = await db.select({ count: sql<number>`count(*)` }).from(stockTxs)

    const [lowStockResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(lte(products.stock, products.minStock))

    const [totalStockResult] = await db.select({ totalStock: sql<number>`coalesce(sum(${products.stock}), 0)` }).from(products)

    return c.json({
      status: "success",
      data: {
        totalProducts: Number(productCountResult?.count ?? 0),
        totalCategories: Number(categoryCountResult?.count ?? 0),
        totalTransactions: Number(txCountResult?.count ?? 0),
        lowStockCount: Number(lowStockResult?.count ?? 0),
        totalStockItems: Number(totalStockResult?.totalStock ?? 0),
      },
    })
  } catch (error) {
    console.error("Report Summary Error:", error)
    return c.json({ status: "error", message: "Failed to generate report summary" }, 500)
  }
})

reportRoutes.get("/low-stock", async (c) => {
  try {
    const lowStockProducts = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        stock: products.stock,
        minStock: products.minStock,
        buyPrice: products.buyPrice,
        sellPrice: products.sellPrice,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(lte(products.stock, products.minStock))

    return c.json({
      status: "success",
      data: lowStockProducts,
    })
  } catch (error) {
    console.error("Low Stock Report Error:", error)
    return c.json({ status: "error", message: "Failed to fetch low stock report" }, 500)
  }
})

reportRoutes.get("/transactions-summary", async (c) => {
  try {
    const summary = await db
      .select({
        type: stockTxs.type,
        count: sql<number>`count(*)`,
      })
      .from(stockTxs)
      .groupBy(stockTxs.type)

    return c.json({
      status: "success",
      data: summary,
    })
  } catch (error) {
    console.error("Transactions Summary Error:", error)
    return c.json({ status: "error", message: "Failed to fetch transactions summary" }, 500)
  }
})

export default reportRoutes
