import { Hono } from "hono"
import { eq, lte, sql, gte } from "drizzle-orm"
import { db } from "../db/index.js"
import { categories, products, stockTxs, stockTxDetails } from "../db/schema.js"
import { authMiddleware, type Env } from "./auth.js"

const reportRoutes = new Hono<Env>()

reportRoutes.use("*", authMiddleware)

const getStartDateFromPeriod = (period: string | undefined): Date | null => {
  if (!period || period === "all") return null;
  const now = new Date();
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (period === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    now.setDate(diff);
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (period === "month") {
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now;
  }
  return null;
};

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
    const period = c.req.query("period")
    const startDate = getStartDateFromPeriod(period)

    // Base query
    let query: any = db
      .select({
        type: stockTxs.type,
        count: sql<number>`count(*)`,
      })
      .from(stockTxs)

    if (startDate) {
      query = query.where(gte(stockTxs.txDate, startDate))
    }

    const summary = await query.groupBy(stockTxs.type)

    return c.json({
      status: "success",
      data: summary,
    })
  } catch (error) {
    console.error("Transactions Summary Error:", error)
    return c.json({ status: "error", message: "Failed to fetch transactions summary" }, 500)
  }
})

reportRoutes.get("/transactions-detail", async (c) => {
  try {
    const period = c.req.query("period")
    const startDate = getStartDateFromPeriod(period)

    let query: any = db
      .select({
        id: stockTxDetails.id,
        txDate: stockTxs.txDate,
        txCode: stockTxs.txCode,
        type: stockTxs.type,
        productName: products.name,
        quantity: stockTxDetails.quantity,
        unitPrice: stockTxDetails.unitPrice,
      })
      .from(stockTxDetails)
      .leftJoin(stockTxs, eq(stockTxDetails.txId, stockTxs.id))
      .leftJoin(products, eq(stockTxDetails.productId, products.id))

    if (startDate) {
      query = query.where(gte(stockTxs.txDate, startDate))
    }

    // Order by date descending
    const details = await query.orderBy(sql`${stockTxs.txDate} desc`)

    return c.json({
      status: "success",
      data: details,
    })
  } catch (error) {
    console.error("Transactions Detail Error:", error)
    return c.json({ status: "error", message: "Failed to fetch transactions detail" }, 500)
  }
})

export default reportRoutes
