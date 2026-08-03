import "dotenv/config"
import { serve } from "@hono/node-server"
import { createServer } from "node:net"
import { Hono } from "hono"
import { cors } from "hono/cors"
import authRoutes from "./routes/auth.js"
import categoriesRoutes from "./routes/categories.js"
import productsRoutes from "./routes/products.js"
import transactionsRoutes from "./routes/transactions.js"
import reportRoutes from "./routes/report-routes.js"

// 1. Inisialisasi Aplikasi Hono
const app = new Hono()

// 2. Middleware CORS
app.use("*", cors())

// 3. Root Route
app.get("/", (c) => {
  return c.json({ status: "success", message: "Inventory API is running" })
})

// 4. Register Sub-Routes
app.route("/api/auth", authRoutes)
app.route("/api/categories", categoriesRoutes)
app.route("/api/products", productsRoutes)
app.route("/api/transactions", transactionsRoutes)
app.route("/api/reports", reportRoutes)

// 5. Global Error Handler
app.onError((err, c) => {
  console.error("Global Error Handler caught:", err)
  return c.json(
    {
      status: "error",
      message: err instanceof Error ? err.message : "Internal Server Error",
    },
    500
  )
})

// 6. Not Found Handler
app.notFound((c) => {
  return c.json({ status: "error", message: "Route not found" }, 404)
})

const getAvailablePort = async (startPort: number): Promise<number> => {
  const probe = createServer()

  return await new Promise((resolve, reject) => {
    probe.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        resolve(getAvailablePort(startPort + 1))
        return
      }

      reject(error)
    })

    probe.once("listening", () => {
      probe.close(() => resolve(startPort))
    })

    probe.listen(startPort)
  })
}

const startServer = async () => {
  const port = await getAvailablePort(Number(process.env.PORT ?? 3001))

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}

void startServer()

export default app