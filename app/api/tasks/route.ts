import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, ObjectId } from "@/lib/database"
import { verifySession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const tasks = await db.collection("tasks").find({}).sort({ createdAt: -1 }).toArray()

    const formattedTasks = tasks.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      assignedToName: task.assignedToName,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      version: task.version || 1,
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, status, priority, assignedTo } = await request.json()

    if (!title || !assignedTo) {
      return NextResponse.json({ error: "Title and assignedTo are required" }, { status: 400 })
    }

    // Validate title uniqueness and column name conflict
    const { db } = await connectToDatabase()

    const existingTask = await db.collection("tasks").findOne({ title })
    if (existingTask) {
      return NextResponse.json({ error: "Task title must be unique" }, { status: 400 })
    }

    const columnNames = ["todo", "in-progress", "done", "To Do", "In Progress", "Done"]
    if (columnNames.includes(title)) {
      return NextResponse.json({ error: "Task title cannot match column names" }, { status: 400 })
    }

    // Get assigned user name
    const assignedUser = await db.collection("users").findOne({ _id: new ObjectId(assignedTo) })
    if (!assignedUser) {
      return NextResponse.json({ error: "Assigned user not found" }, { status: 400 })
    }

    const now = new Date()
    const task = {
      title,
      description: description || "",
      status,
      priority,
      assignedTo,
      assignedToName: assignedUser.name,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }

    const result = await db.collection("tasks").insertOne(task)

    // Log activity
    await db.collection("activities").insertOne({
      action: "created",
      taskId: result.insertedId.toString(),
      taskTitle: title,
      userId: session.user.id,
      userName: session.user.name,
      details: `Created task and assigned to ${assignedUser.name}`,
      timestamp: now,
    })

    const createdTask = {
      id: result.insertedId.toString(),
      ...task,
    }

    // Emit socket event (you'll need to implement socket server)
    // getSocket()?.emit('taskCreated', createdTask)
    // getSocket()?.emit('activityLogged', activity)

    return NextResponse.json(createdTask)
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
