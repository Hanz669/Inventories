import "dotenv/config"
import bcrypt from "bcryptjs"
import { db } from "./index.js"
import { categories, products, users } from "./schema.js"
import { eq } from "drizzle-orm"

const seed = async () => {
  try {
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@inventory.com"))
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      await db.insert(users).values({
        name: "System Admin",
        email: "admin@inventory.com",
        password: hashedPassword,
        role: "ADMIN",
      })
    }

    const existingCategories = await db.select().from(categories)
    if (existingCategories.length === 0) {
      const insertedCategories = await db.insert(categories).values([
        { name: "Elektronik" },
        { name: "Pakaian" },
        { name: "Alat Tulis" },
      ])

      const allCategories = await db.select().from(categories)

      await db.insert(products).values([
        {
          categoryId: allCategories[0]?.id ?? null,
          sku: "ELEC-001",
          name: "Laptop",
          stock: 10,
          minStock: 3,
          buyPrice: "12000000",
          sellPrice: "15000000",
        },
        {
          categoryId: allCategories[1]?.id ?? null,
          sku: "CLOTH-001",
          name: "Kaos Polos",
          stock: 25,
          minStock: 5,
          buyPrice: "50000",
          sellPrice: "90000",
        },
        {
          categoryId: allCategories[2]?.id ?? null,
          sku: "STATION-001",
          name: "Notebook A5",
          stock: 50,
          minStock: 10,
          buyPrice: "15000",
          sellPrice: "25000",
        },
      ])
    }

    console.log("Seed completed successfully")
  } catch (error) {
    console.error("Seed failed", error)
    process.exitCode = 1
  }
}

void seed()
