import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/index.js"
import { products, stockTxDetails, stockTxs, users } from "../db/schema.js"
import { authMiddleware, handleValidation, type Env } from "./auth.js"

const transactionsRoute = new Hono<Env>()

const transactionSchema = z.object({
  userId: z.string().optional(),
  txCode: z.string().min(1, "Transaction code is required").optional(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Valid product ID is required"),
      quantity: z.number().int().positive("Quantity must be greater than 0"),
      unitPrice: z.union([z.string(), z.number()]),
    }),
  ).min(1, "At least one item is required"),
})

transactionsRoute.use("*", authMiddleware)

transactionsRoute.get("/", async (c) => {
  try {
    const data = await db.select().from(stockTxs).orderBy(desc(stockTxs.txDate))
    return c.json({ status: "success", data })
  } catch (error) {
    console.error("Fetch Transactions Error:", error)
    return c.json({ status: "error", message: "Failed to fetch transactions" }, 500)
  }
})

transactionsRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id")
    if (!id) {
      return c.json({ status: "error", message: "Invalid transaction ID" }, 400)
    }

    const [txHeader] = await db.select().from(stockTxs).where(eq(stockTxs.id, id))
    if (!txHeader) {
      return c.json({ status: "error", message: "Transaction not found" }, 404)
    }

    const details = await db
      .select({
        id: stockTxDetails.id,
        txId: stockTxDetails.txId,
        productId: stockTxDetails.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: stockTxDetails.quantity,
        unitPrice: stockTxDetails.unitPrice,
      })
      .from(stockTxDetails)
      .leftJoin(products, eq(stockTxDetails.productId, products.id))
      .where(eq(stockTxDetails.txId, id))

    return c.json({
      status: "success",
      data: {
        ...txHeader,
        items: details,
      },
    })
  } catch (error) {
    console.error("Fetch Transaction Detail Error:", error)
    return c.json({ status: "error", message: "Failed to fetch transaction detail" }, 500)
  }
})

transactionsRoute.post("/", zValidator("json", transactionSchema, handleValidation), async (c) => {
  try {
    const user = c.get("user")
    const body = c.req.valid("json")
    const { userId, type, notes, items } = body

    if (userId) {
      const existingUser = await db.select().from(users).where(eq(users.id, userId))
      if (existingUser.length === 0) {
        return c.json({ status: "error", message: `User with ID ${userId} does not exist` }, 400)
      }
    }

    const activeUserId = userId ?? user?.id ?? null
    const txCode = body.txCode ?? `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    if (body.txCode) {
      const existingTx = await db.select().from(stockTxs).where(eq(stockTxs.txCode, body.txCode))
      if (existingTx.length > 0) {
        return c.json({ status: "error", message: `Transaction code '${body.txCode}' already exists` }, 400)
      }
    }

    const result = await db.transaction(async (tx) => {
      const txId = crypto.randomUUID()
      await tx.insert(stockTxs).values({
        id: txId,
        userId: activeUserId,
        txCode,
        type,
        notes: notes ?? null,
      })

      for (const item of items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId))
        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`)
        }

        const quantity = Number(item.quantity)
        const unitPrice = String(item.unitPrice)
        const currentStock = Number(product.stock)

        let nextStock: number
        if (type === "OUT") {
          if (quantity > currentStock) {
            throw new Error(`INSUFFICIENT_STOCK:${product.name}:${currentStock}:${quantity}`)
          }
          nextStock = currentStock - quantity
        } else if (type === "IN") {
          nextStock = currentStock + quantity
        } else {
          nextStock = quantity
        }

        const detailId = crypto.randomUUID()
        await tx.insert(stockTxDetails).values({
          id: detailId,
          txId,
          productId: item.productId,
          quantity,
          unitPrice,
        })

        await tx.update(products).set({ stock: nextStock }).where(eq(products.id, item.productId))
      }

      return { txId, txCode }
    })

    return c.json(
      {
        status: "success",
        message: "Transaction recorded successfully",
        data: result,
      },
      201,
    )
  } catch (error: any) {
    console.error("Create Transaction Error:", error)
    const errMessage = error instanceof Error ? error.message : String(error)

    if (errMessage.startsWith("PRODUCT_NOT_FOUND:")) {
      const productId = errMessage.split(":")[1]
      return c.json({ status: "error", message: `Product with ID ${productId} was not found` }, 400)
    }

    if (errMessage.startsWith("INSUFFICIENT_STOCK:")) {
      const [, productName, available, requested] = errMessage.split(":")
      return c.json(
        {
          status: "error",
          message: `Insufficient stock for product '${productName}'. Available: ${available}, Requested: ${requested}`,
        },
        400,
      )
    }

    return c.json({ status: "error", message: "Failed to record transaction" }, 500)
  }
})

export default transactionsRoute
