import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, ObjectId } from "@/lib/database"
import { verifySession } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const taskId = params.id

    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 })
    }

    const task = await db.collection("tasks").findOne({ _id: new ObjectId(taskId) })
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Get all users
    const users = await db.collection("users").find({}).toArray()

    // Count active tasks (todo and in-progress) for each user
    const userTaskCounts = await Promise.all(
      users.map(async (user) => {
        const activeTaskCount = await db.collection("tasks").countDocuments({
          assignedTo: user._id.toString(),
          status: { $in: ["todo", "in-progress"] },
        })

        return {
          userId: user._id.toString(),
          name: user.name,
          activeTaskCount,
        }
      }),
    )

    // Find user with fewest active tasks
    const userWithFewestTasks = userTaskCounts.reduce((min, current) =>
      current.activeTaskCount < min.activeTaskCount ? current : min,
    )

    // Update task assignment
    const now = new Date()
    await db.collection("tasks").updateOne(
      { _id: new ObjectId(taskId) },
      {
        $set: {
          assignedTo: userWithFewestTasks.userId,
          assignedToName: userWithFewestTasks.name,
          updatedAt: now,
          version: (task.version || 1) + 1,
        },
      },
    )

    // Log activity
    await db.collection("activities").insertOne({
      action: "assigned",
      taskId: taskId,
      taskTitle: task.title,
      userId: session.user.id,
      userName: session.user.name,
      details: `Smart assigned to ${userWithFewestTasks.name} (${userWithFewestTasks.activeTaskCount} active tasks)`,
      timestamp: now,
    })

    const updatedTask = {
      ...task,
      id: taskId,
      assignedTo: userWithFewestTasks.userId,
      assignedToName: userWithFewestTasks.name,
      updatedAt: now,
      version: (task.version || 1) + 1,
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Smart assign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
