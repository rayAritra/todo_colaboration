"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Edit, Trash2, Zap, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import EditTaskForm from "./edit-task-form"
import ConflictResolution from "./conflict-resolution"

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

interface TaskCardProps {
  task: Task
  users: User[]
  currentUserId: string
  onSmartAssign: () => void
  onTaskUpdated: () => void
}

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

const STATUS_ICONS = {
  todo: Clock,
  "in-progress": AlertCircle,
  done: CheckCircle2,
}

export default function TaskCard({ task, users, currentUserId, onSmartAssign, onTaskUpdated }: TaskCardProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showConflictResolution, setShowConflictResolution] = useState(false)
  const [conflictData, setConflictData] = useState<any>(null)

  const StatusIcon = STATUS_ICONS[task.status]

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onTaskUpdated()
      } else {
        throw new Error("Failed to delete task")
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleEditSubmit = async (updatedTask: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...task,
          ...updatedTask,
          version: task.version,
        }),
      })

      const data = await response.json()

      if (response.status === 409) {
        // Conflict detected
        setConflictData(data)
        setShowConflictResolution(true)
        setShowEditForm(false)
      } else if (response.ok) {
        setShowEditForm(false)
        onTaskUpdated()
      } else {
        throw new Error(data.error || "Failed to update task")
      }
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const handleConflictResolution = async (resolution: "merge" | "overwrite", resolvedTask: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/resolve-conflict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolution,
          task: resolvedTask,
        }),
      })

      if (response.ok) {
        setShowConflictResolution(false)
        setConflictData(null)
        onTaskUpdated()
      } else {
        throw new Error("Failed to resolve conflict")
      }
    } catch (error) {
      console.error("Failed to resolve conflict:", error)
    }
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <StatusIcon className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{task.title}</h4>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSmartAssign}>
                  <Zap className="h-4 w-4 mr-2" />
                  Smart Assign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {task.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-blue-500 text-white">
                  {task.assignedToName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>

      {showEditForm && (
        <EditTaskForm task={task} users={users} onClose={() => setShowEditForm(false)} onSubmit={handleEditSubmit} />
      )}

      {showConflictResolution && conflictData && (
        <ConflictResolution
          conflictData={conflictData}
          onResolve={handleConflictResolution}
          onClose={() => {
            setShowConflictResolution(false)
            setConflictData(null)
          }}
        />
      )}
    </>
  )
}
