import { Hono } from "hono"
import { eq, lte, sql, gte, and } from "drizzle-orm"
import { db } from "../db/index.js"
import { categories, products, stockTxs, stockTxDetails, users } from "../db/schema.js"
import { authMiddleware, adminOnlyMiddleware, type Env } from "./auth.js"

const reportRoutes = new Hono<Env>()

reportRoutes.use("*", authMiddleware)

const getDateRangeFromPeriod = (period: string | undefined, customStart?: string, customEnd?: string): { startDate: Date | null, endDate: Date | null } => {
  if (period === "custom") {
    let startDate = null;
    let endDate = null;
    if (customStart) {
      startDate = new Date(customStart);
      startDate.setHours(0, 0, 0, 0);
    }
    if (customEnd) {
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    }
    return { startDate, endDate };
  }

  if (!period || period === "all") return { startDate: null, endDate: null };
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  if (period === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  if (period === "week") {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  if (period === "this_month" || period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  if (period === "last_month") {
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    
    end.setDate(0); // last day of previous month
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  return { startDate: null, endDate: null };
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
    const customStart = c.req.query("startDate")
    const customEnd = c.req.query("endDate")
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStart, customEnd)

    // Base query
    let query: any = db
      .select({
        type: stockTxs.type,
        count: sql<number>`count(*)`,
      })
      .from(stockTxs)

    if (startDate && endDate) {
      query = query.where(and(gte(stockTxs.txDate, startDate), lte(stockTxs.txDate, endDate)))
    } else if (startDate) {
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
    const customStart = c.req.query("startDate")
    const customEnd = c.req.query("endDate")
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStart, customEnd)

    let query: any = db
      .select({
        id: stockTxDetails.id,
        txDate: stockTxs.txDate,
        txCode: stockTxs.txCode,
        type: stockTxs.type,
        productName: products.name,
        quantity: stockTxDetails.quantity,
        unitPrice: stockTxDetails.unitPrice,
        userName: users.name,
      })
      .from(stockTxDetails)
      .leftJoin(stockTxs, eq(stockTxDetails.txId, stockTxs.id))
      .leftJoin(products, eq(stockTxDetails.productId, products.id))
      .leftJoin(users, eq(stockTxs.userId, users.id))

    if (startDate && endDate) {
      query = query.where(and(gte(stockTxs.txDate, startDate), lte(stockTxs.txDate, endDate)))
    } else if (startDate) {
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
