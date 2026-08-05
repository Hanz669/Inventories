import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/index.js"
import { categories, products } from "../db/schema.js"
import { authMiddleware, adminOnlyMiddleware, handleValidation, type Env } from "./auth.js"

const categoriesRoute = new Hono<Env>()

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
})

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
})

categoriesRoute.use("*", authMiddleware)

categoriesRoute.get("/", async (c) => {
  try {
    const data = await db.select().from(categories)
    return c.json({ status: "success", data })
  } catch (error) {
    console.error("Fetch Categories Error:", error)
    return c.json({ status: "error", message: "Failed to fetch categories" }, 500)
  }
})

categoriesRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id")
    if (!id) {
      return c.json({ status: "error", message: "Invalid category ID" }, 400)
    }

    const [category] = await db.select().from(categories).where(eq(categories.id, id))
    if (!category) {
      return c.json({ status: "error", message: "Category not found" }, 404)
    }

    return c.json({ status: "success", data: category })
  } catch (error) {
    console.error("Fetch Category Detail Error:", error)
    return c.json({ status: "error", message: "Failed to fetch category detail" }, 500)
  }
})

categoriesRoute.post("/", adminOnlyMiddleware, zValidator("json", createCategorySchema, handleValidation), async (c) => {
  try {
    const { name } = c.req.valid("json")
    const newId = crypto.randomUUID()

    await db.insert(categories).values({ id: newId, name })

    return c.json({ status: "success", message: "Category created successfully", data: { id: newId, name } }, 201)
  } catch (error) {
    console.error("Create Category Error:", error)
    return c.json({ status: "error", message: "Failed to create category" }, 500)
  }
})

categoriesRoute.put("/:id", adminOnlyMiddleware, zValidator("json", updateCategorySchema, handleValidation), async (c) => {
  try {
    const id = c.req.param("id")
    if (!id) {
      return c.json({ status: "error", message: "Invalid category ID" }, 400)
    }

    const [existing] = await db.select().from(categories).where(eq(categories.id, id))
    if (!existing) {
      return c.json({ status: "error", message: "Category not found" }, 404)
    }

    const { name } = c.req.valid("json")
    await db.update(categories).set({ name }).where(eq(categories.id, id))

    return c.json({ status: "success", message: "Category updated successfully", data: { id, name } })
  } catch (error) {
    console.error("Update Category Error:", error)
    return c.json({ status: "error", message: "Failed to update category" }, 500)
  }
})

categoriesRoute.delete("/:id", adminOnlyMiddleware, async (c) => {
  try {
    const id = c.req.param("id")
    if (!id) {
      return c.json({ status: "error", message: "Invalid category ID" }, 400)
    }

    const [existing] = await db.select().from(categories).where(eq(categories.id, id))
    if (!existing) {
      return c.json({ status: "error", message: "Category not found" }, 404)
    }

    await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id))
    await db.delete(categories).where(eq(categories.id, id))

    return c.json({ status: "success", message: "Category deleted successfully" })
  } catch (error) {
    console.error("Delete Category Error:", error)
    return c.json({ status: "error", message: "Failed to delete category" }, 500)
  }
})

export default categoriesRoute
