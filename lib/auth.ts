import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: string
  name: string
  email: string
}

export interface Session {
  user: User
}

export async function verifySession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token.value, JWT_SECRET) as any
    return {
      user: {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
      },
    }
  } catch (error) {
    return null
  }
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}
