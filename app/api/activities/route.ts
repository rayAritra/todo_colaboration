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

    const activities = await db.collection("activities").find({}).sort({ timestamp: -1 }).limit(20).toArray()

    const formattedActivities = activities.map((activity) => ({
      id: activity._id.toString(),
      action: activity.action,
      taskId: activity.taskId,
      taskTitle: activity.taskTitle,
      userId: activity.userId,
      userName: activity.userName,
      details: activity.details,
      timestamp: activity.timestamp,
    }))

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error("Get activities error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
