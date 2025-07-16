"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSocket } from "@/hooks/use-socket"
import { formatDistanceToNow } from "date-fns"
import { Plus, Edit, Trash2, ArrowRight, User, Activity } from "lucide-react"

interface ActivityLog {
  id: string
  action: "created" | "updated" | "deleted" | "assigned" | "moved"
  taskId: string
  taskTitle: string
  userId: string
  userName: string
  details: string
  timestamp: string
}

const ACTION_ICONS = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  assigned: User,
  moved: ArrowRight,
}

const ACTION_COLORS = {
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  deleted: "bg-red-100 text-red-800",
  assigned: "bg-purple-100 text-purple-800",
  moved: "bg-yellow-100 text-yellow-800",
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const socket = useSocket()

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("activityLogged", (activity: ActivityLog) => {
      setActivities((prev) => [activity, ...prev.slice(0, 19)])
    })

    return () => {
      socket.off("activityLogged")
    }
  }, [socket])

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activities")
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Activity Log</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Activity Log</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No activities yet</p>
          ) : (
            activities.map((activity) => {
              const ActionIcon = ACTION_ICONS[activity.action]
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {activity.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <ActionIcon className="h-4 w-4 text-gray-500" />
                      <Badge variant="secondary" className={`text-xs ${ACTION_COLORS[activity.action]}`}>
                        {activity.action}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-900 mb-1">
                      <span className="font-medium">{activity.userName}</span>{" "}
                      {activity.action === "created" && "created"}
                      {activity.action === "updated" && "updated"}
                      {activity.action === "deleted" && "deleted"}
                      {activity.action === "assigned" && "assigned"}
                      {activity.action === "moved" && "moved"}{" "}
                      <span className="font-medium">"{activity.taskTitle}"</span>
                    </p>

                    {activity.details && <p className="text-xs text-gray-600 mb-2">{activity.details}</p>}

                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
