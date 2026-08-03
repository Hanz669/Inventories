import { Hono } from "hono"
import type { Context, Next } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { db } from "../db/index.js"
import { users } from "../db/schema.js"

export type JwtPayload = {
  id: number
  name?: string
  email: string
  role: "ADMIN" | "STAFF"
}

export type Env = {
  Variables: {
    user: JwtPayload
  }
}

const auth = new Hono<Env>()

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
})

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
})

const jwtSecret = process.env.JWT_SECRET ?? "inventory-secret"

export const handleValidation = (result: any, c: Context) => {
  if (!result.success) {
    const firstMessage = result.error?.issues?.[0]?.message || "Validation failed"
    return c.json(
      {
        status: "error",
        message: firstMessage,
        errors: result.error.flatten ? result.error.flatten() : result.error,
      },
      400,
    )
  }
}

export const authMiddleware = async (c: Context<Env>, next: Next) => {
  const header = c.req.header("authorization") || c.req.header("Authorization")
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return c.json({ status: "error", message: "Unauthorized: Missing token" }, 401)
  }

  const token = header.slice(7).trim()
  if (!token) {
    return c.json({ status: "error", message: "Unauthorized: Empty token" }, 401)
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload
    c.set("user", payload)
    await next()
  } catch (error) {
    return c.json({ status: "error", message: "Invalid or expired token" }, 401)
  }
}

export const adminOnlyMiddleware = async (c: Context<Env>, next: Next) => {
  const user = c.get("user")
  if (!user || user.role !== "ADMIN") {
    return c.json({ status: "error", message: "Forbidden: Admin access required" }, 403)
  }
  await next()
}

auth.get("/status", (c) => {
  return c.json({
    status: "success",
    message: "Auth service is ready",
  })
})

auth.get("/me", authMiddleware, (c) => {
  const user = c.get("user")
  return c.json({
    status: "success",
    data: user,
  })
})

auth.post("/register", zValidator("json", registerSchema, handleValidation), async (c) => {
  try {
    const body = c.req.valid("json")
    const { name, email, password, role } = body

    const existingUsers = await db.select().from(users).where(eq(users.email, email))
    if (existingUsers.length > 0) {
      return c.json({ status: "error", message: "Email is already registered" }, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const insertResult = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: role ?? "STAFF",
    })

    const newUserId = (insertResult[0] as any)?.insertId ?? (insertResult as any)?.insertId

    return c.json(
      {
        status: "success",
        message: "User registered successfully",
        data: {
          id: newUserId,
          name,
          email,
          role: role ?? "STAFF",
        },
      },
      201,
    )
  } catch (error) {
    console.error("Register Error:", error)
    return c.json({ status: "error", message: "Failed to register user" }, 500)
  }
})

auth.post("/login", zValidator("json", loginSchema, handleValidation), async (c) => {
  try {
    const body = c.req.valid("json")
    const { email, password } = body

    const foundUsers = await db.select().from(users).where(eq(users.email, email))
    const user = foundUsers[0]

    if (!user) {
      return c.json({ status: "error", message: "Invalid email or password" }, 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return c.json({ status: "error", message: "Invalid email or password" }, 401)
    }

    const payload: JwtPayload = { id: user.id, name: user.name, email: user.email, role: user.role }
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "8h" })

    return c.json({
      status: "success",
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    })
  } catch (error) {
    console.error("Login Error:", error)
    return c.json({ status: "error", message: "Failed to login" }, 500)
  }
})

export default auth