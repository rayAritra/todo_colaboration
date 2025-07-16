import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database"
import { verifySession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray()

    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
