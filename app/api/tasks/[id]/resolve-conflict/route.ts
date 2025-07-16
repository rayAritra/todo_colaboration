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
    const { resolution, task: resolvedTask } = await request.json()

    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 })
    }

    const currentTask = await db.collection("tasks").findOne({ _id: new ObjectId(taskId) })
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Validate title uniqueness if title changed
    if (resolvedTask.title !== currentTask.title) {
      const existingTask = await db.collection("tasks").findOne({
        title: resolvedTask.title,
        _id: { $ne: new ObjectId(taskId) },
      })
      if (existingTask) {
        return NextResponse.json({ error: "Task title must be unique" }, { status: 400 })
      }
    }

    // Get assigned user name if needed
    if (resolvedTask.assignedTo !== currentTask.assignedTo) {
      const assignedUser = await db.collection("users").findOne({ _id: new ObjectId(resolvedTask.assignedTo) })
      if (!assignedUser) {
        return NextResponse.json({ error: "Assigned user not found" }, { status: 400 })
      }
      resolvedTask.assignedToName = assignedUser.name
    }

    const now = new Date()
    const updatedTask = {
      title: resolvedTask.title,
      description: resolvedTask.description,
      status: resolvedTask.status,
      priority: resolvedTask.priority,
      assignedTo: resolvedTask.assignedTo,
      assignedToName: resolvedTask.assignedToName,
      updatedAt: now,
      version: currentTask.version + 1,
    }

    await db.collection("tasks").updateOne({ _id: new ObjectId(taskId) }, { $set: updatedTask })

    // Log activity
    await db.collection("activities").insertOne({
      action: "updated",
      taskId: taskId,
      taskTitle: resolvedTask.title,
      userId: session.user.id,
      userName: session.user.name,
      details: `Resolved conflict using ${resolution} strategy`,
      timestamp: now,
    })

    const finalTask = {
      id: taskId,
      ...currentTask,
      ...updatedTask,
    }

    return NextResponse.json(finalTask)
  } catch (error) {
    console.error("Resolve conflict error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
