"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import TaskCard from "./task-card"
import AddTaskForm from "./add-task-form"
import { useSocket } from "@/hooks/use-socket"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  assignedTo: string
  assignedToName: string
  createdBy: string
  createdAt: string
  updatedAt: string
  version: number
}

interface User {
  id: string
  name: string
  email: string
}

interface KanbanBoardProps {
  userId: string
}

const COLUMNS = {
  todo: { title: "To Do", color: "bg-red-50 border-red-200" },
  "in-progress": { title: "In Progress", color: "bg-yellow-50 border-yellow-200" },
  done: { title: "Done", color: "bg-green-50 border-green-200" },
}

export default function KanbanBoard({ userId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showAddForm, setShowAddForm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const socket = useSocket()

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("taskUpdated", (updatedTask: Task) => {
      setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    })

    socket.on("taskCreated", (newTask: Task) => {
      setTasks((prev) => [...prev, newTask])
    })

    socket.on("taskDeleted", (taskId: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    })

    return () => {
      socket.off("taskUpdated")
      socket.off("taskCreated")
      socket.off("taskDeleted")
    }
  }, [socket])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    const newStatus = destination.droppableId as Task["status"]

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...task,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }
    } catch (error) {
      console.error("Failed to update task:", error)
      // Revert the change
      fetchTasks()
    }
  }

  const handleSmartAssign = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/smart-assign`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to smart assign task")
      }
    } catch (error) {
      console.error("Failed to smart assign task:", error)
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Board</h2>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(COLUMNS).map(([status, column]) => (
            <div key={status} className={`rounded-lg border-2 ${column.color} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{column.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{getTasksByStatus(status).length}</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(status)} className="h-6 w-6 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {showAddForm === status && (
                <div className="mb-4">
                  <AddTaskForm
                    status={status as Task["status"]}
                    users={users}
                    onClose={() => setShowAddForm(null)}
                    onTaskCreated={() => {
                      setShowAddForm(null)
                      fetchTasks()
                    }}
                  />
                </div>
              )}

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] transition-colors duration-200 ${
                      snapshot.isDraggingOver ? "bg-blue-50" : ""
                    }`}
                  >
                    {getTasksByStatus(status).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-transform duration-200 ${
                              snapshot.isDragging ? "rotate-3 scale-105" : ""
                            }`}
                          >
                            <TaskCard
                              task={task}
                              users={users}
                              currentUserId={userId}
                              onSmartAssign={() => handleSmartAssign(task.id)}
                              onTaskUpdated={fetchTasks}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
