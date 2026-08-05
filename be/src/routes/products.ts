import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, ne, and, like, or, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/index.js"
import { categories, products, stockTxDetails } from "../db/schema.js"
import { authMiddleware, adminOnlyMiddleware, handleValidation, type Env } from "./auth.js"

const productsRoute = new Hono<Env>()

const productSchema = z.object({
  categoryId: z.string().nullable().optional(),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  stock: z.coerce.number().int().nonnegative().optional(),
  minStock: z.coerce.number().int().nonnegative().optional(),
  buyPrice: z.coerce.number().nonnegative("Buy price must be non-negative"),
  sellPrice: z.coerce.number().nonnegative("Sell price must be non-negative"),
})

productsRoute.use("*", authMiddleware)

productsRoute.get("/", async (c) => {
  try {
    const page = Number(c.req.query("page")) || 1
    const limit = Number(c.req.query("limit")) || 10
    const search = c.req.query("search") || ""
    const offset = (page - 1) * limit

    const searchFilter = search ? or(like(products.name, `%${search}%`), like(products.sku, `%${search}%`)) : undefined

    const data = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        stock: products.stock,
        minStock: products.minStock,
        buyPrice: products.buyPrice,
        sellPrice: products.sellPrice,
        categoryId: products.categoryId,
        categoryName: categories.name,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(searchFilter)
      .limit(limit)
      .offset(offset)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(searchFilter)

    return c.json({ 
      status: "success", 
      data: {
        items: data,
        meta: {
          total: Number(count),
          page,
          limit,
          totalPages: Math.ceil(Number(count) / limit)
        }
      } 
    })
  } catch (error) {
    console.error("Fetch Products Error:", error)
    return c.json({ status: "error", message: "Failed to fetch products" }, 500)
  }
})

productsRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id")
    if (!id) {
      return c.json({ status: "error", message: "Invalid product ID" }, 400)
    }

    const [product] = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        stock: products.stock,
        minStock: products.minStock,
        buyPrice: products.buyPrice,
        sellPrice: products.sellPrice,
        categoryId: products.categoryId,
        categoryName: categories.name,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))

    if (!product) {
      return c.json({ status: "error", message: "Product not found" }, 404)
    }

    return c.json({ status: "success", data: product })
  } catch (error) {
    console.error("Fetch Product Detail Error:", error)
    return c.json({ status: "error", message: "Failed to fetch product detail" }, 500)
  }
})

productsRoute.post("/", adminOnlyMiddleware, zValidator("json", productSchema, handleValidation), async (c) => {
  try {
    const body = c.req.valid("json")
    const { categoryId, sku, name, stock, minStock, buyPrice, sellPrice } = body

    const existingSku = await db.select().from(products).where(eq(products.sku, sku))
    if (existingSku.length > 0) {
      return c.json({ status: "error", message: `SKU '${sku}' is already in use` }, 400)
    }

    if (categoryId) {
      const existingCategory = await db.select().from(categories).where(eq(categories.id, categoryId))
      if (existingCategory.length === 0) {
        return c.json({ status: "error", message: `Category with ID ${categoryId} does not exist` }, 400)
      }
    }

    const newId = crypto.randomUUID()

    await db.insert(products).values({
      id: newId,
      categoryId: categoryId ?? null,
      sku,
      name,
      stock: stock !== undefined ? Number(stock) : 0,
      minStock: minStock !== undefined ? Number(minStock) : 5,
      buyPrice: String(buyPrice),
      sellPrice: String(sellPrice),
    })

    return c.json({ status: "success", message: "Product created successfully", data: { id: newId, sku, name } }, 201)
  } catch (error) {
    console.error("Create Product Error:", error)
    return c.json({ status: "error", message: "Failed to create product" }, 500)
  }
})

productsRoute.put("/:id", adminOnlyMiddleware, zValidator("json", productSchema, handleValidation), async (c) => {
  try {
    const id = c.req.param("id")
    if (!id) {
      return c.json({ status: "error", message: "Invalid product ID" }, 400)
    }

    const [existingProduct] = await db.select().from(products).where(eq(products.id, id))
    if (!existingProduct) {
      return c.json({ status: "error", message: "Product not found" }, 404)
    }

    const body = c.req.valid("json")

    const duplicateSku = await db
      .select()
      .from(products)
      .where(and(eq(products.sku, body.sku), ne(products.id, id)))

    if (duplicateSku.length > 0) {
      return c.json({ status: "error", message: `SKU '${body.sku}' is already in use by another product` }, 400)
    }

    if (body.categoryId) {
      const existingCategory = await db.select().from(categories).where(eq(categories.id, body.categoryId))
      if (existingCategory.length === 0) {
        return c.json({ status: "error", message: `Category with ID ${body.categoryId} does not exist` }, 400)
      }
    }

    await db
      .update(products)
      .set({
        categoryId: body.categoryId !== undefined ? body.categoryId : existingProduct.categoryId,
        sku: body.sku,
        name: body.name,
        stock: body.stock !== undefined ? Number(body.stock) : existingProduct.stock,
        minStock: body.minStock !== undefined ? Number(body.minStock) : existingProduct.minStock,
        buyPrice: body.buyPrice !== undefined ? String(body.buyPrice) : existingProduct.buyPrice,
        sellPrice: body.sellPrice !== undefined ? String(body.sellPrice) : existingProduct.sellPrice,
      })
      .where(eq(products.id, id))

    return c.json({ status: "success", message: "Product updated successfully", data: { id, sku: body.sku, name: body.name } })
  } catch (error) {
    console.error("Update Product Error:", error)
    return c.json({ status: "error", message: "Failed to update product" }, 500)
  }
})

productsRoute.delete("/:id", adminOnlyMiddleware, async (c) => {
  try {
    const id = c.req.param("id")
    if (!id) {
      return c.json({ status: "error", message: "Invalid product ID" }, 400)
    }

    const [existingProduct] = await db.select().from(products).where(eq(products.id, id))
    if (!existingProduct) {
      return c.json({ status: "error", message: "Product not found" }, 404)
    }

    const txDetails = await db.select().from(stockTxDetails).where(eq(stockTxDetails.productId, id))
    if (txDetails.length > 0) {
      return c.json(
        {
          status: "error",
          message: "Cannot delete product because it is referenced in existing stock transactions",
        },
        400,
      )
    }

    await db.delete(products).where(eq(products.id, id))

    return c.json({ status: "success", message: "Product deleted successfully" })
  } catch (error: any) {
    console.error("Delete Product Error:", error)
    if (error?.code === "ER_ROW_IS_REFERENCED_2" || error?.errno === 1451) {
      return c.json({ status: "error", message: "Cannot delete product because it is referenced in transactions" }, 400)
    }
    return c.json({ status: "error", message: "Failed to delete product" }, 500)
  }
})

export default productsRoute
