import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, ObjectId } from "@/lib/database"
import { verifySession } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const updateData = await request.json()
    const { version, ...taskUpdates } = updateData

    // Get current task for conflict detection
    const currentTask = await db.collection("tasks").findOne({ _id: new ObjectId(taskId) })
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check for conflicts
    if (version && currentTask.version > version) {
      return NextResponse.json(
        {
          error: "Conflict detected",
          message: "This task has been modified by another user. Please resolve the conflict.",
          currentTask: {
            id: currentTask._id.toString(),
            title: currentTask.title,
            description: currentTask.description,
            status: currentTask.status,
            priority: currentTask.priority,
            assignedTo: currentTask.assignedTo,
            assignedToName: currentTask.assignedToName,
            createdBy: currentTask.createdBy,
            createdAt: currentTask.createdAt,
            updatedAt: currentTask.updatedAt,
            version: currentTask.version,
          },
          yourChanges: {
            id: taskId,
            ...taskUpdates,
            version: version,
          },
        },
        { status: 409 },
      )
    }

    // Validate title uniqueness if title is being updated
    if (taskUpdates.title && taskUpdates.title !== currentTask.title) {
      const existingTask = await db.collection("tasks").findOne({
        title: taskUpdates.title,
        _id: { $ne: new ObjectId(taskId) },
      })
      if (existingTask) {
        return NextResponse.json({ error: "Task title must be unique" }, { status: 400 })
      }

      const columnNames = ["todo", "in-progress", "done", "To Do", "In Progress", "Done"]
      if (columnNames.includes(taskUpdates.title)) {
        return NextResponse.json({ error: "Task title cannot match column names" }, { status: 400 })
      }
    }

    // Get assigned user name if assignedTo is being updated
    if (taskUpdates.assignedTo && taskUpdates.assignedTo !== currentTask.assignedTo) {
      const assignedUser = await db.collection("users").findOne({ _id: new ObjectId(taskUpdates.assignedTo) })
      if (!assignedUser) {
        return NextResponse.json({ error: "Assigned user not found" }, { status: 400 })
      }
      taskUpdates.assignedToName = assignedUser.name
    }

    const now = new Date()
    const updatedTask = {
      ...taskUpdates,
      updatedAt: now,
      version: (currentTask.version || 1) + 1,
    }

    await db.collection("tasks").updateOne({ _id: new ObjectId(taskId) }, { $set: updatedTask })

    // Determine what changed for activity log
    let details = "Updated task"
    if (taskUpdates.status && taskUpdates.status !== currentTask.status) {
      details = `Moved from ${currentTask.status} to ${taskUpdates.status}`
    } else if (taskUpdates.assignedTo && taskUpdates.assignedTo !== currentTask.assignedTo) {
      details = `Reassigned to ${taskUpdates.assignedToName}`
    }

    // Log activity
    await db.collection("activities").insertOne({
      action:
        taskUpdates.status !== currentTask.status
          ? "moved"
          : taskUpdates.assignedTo !== currentTask.assignedTo
            ? "assigned"
            : "updated",
      taskId: taskId,
      taskTitle: taskUpdates.title || currentTask.title,
      userId: session.user.id,
      userName: session.user.name,
      details,
      timestamp: now,
    })

    const finalTask = {
      id: taskId,
      ...currentTask,
      ...updatedTask,
    }

    return NextResponse.json(finalTask)
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    await db.collection("tasks").deleteOne({ _id: new ObjectId(taskId) })

    // Log activity
    await db.collection("activities").insertOne({
      action: "deleted",
      taskId: taskId,
      taskTitle: task.title,
      userId: session.user.id,
      userName: session.user.name,
      details: "Deleted task",
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
