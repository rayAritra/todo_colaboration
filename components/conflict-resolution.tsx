"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

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

interface ConflictData {
  currentTask: Task
  yourChanges: Task
  message: string
}

interface ConflictResolutionProps {
  conflictData: ConflictData
  onResolve: (resolution: "merge" | "overwrite", resolvedTask: Task) => void
  onClose: () => void
}

export default function ConflictResolution({ conflictData, onResolve, onClose }: ConflictResolutionProps) {
  const [selectedResolution, setSelectedResolution] = useState<"merge" | "overwrite" | null>(null)
  const [mergedTask, setMergedTask] = useState<Task>(conflictData.yourChanges)

  const handleMerge = () => {
    // Simple merge strategy - you can make this more sophisticated
    const merged: Task = {
      ...conflictData.currentTask,
      title: conflictData.yourChanges.title,
      description: conflictData.yourChanges.description || conflictData.currentTask.description,
      priority: conflictData.yourChanges.priority,
      assignedTo: conflictData.yourChanges.assignedTo,
      assignedToName: conflictData.yourChanges.assignedToName,
      status: conflictData.yourChanges.status,
    }

    setMergedTask(merged)
    setSelectedResolution("merge")
  }

  const handleOverwrite = () => {
    setMergedTask(conflictData.yourChanges)
    setSelectedResolution("overwrite")
  }

  const handleConfirm = () => {
    if (selectedResolution) {
      onResolve(selectedResolution, mergedTask)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Conflict Detected</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">{conflictData.message}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Version (Server)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Title:</strong> {conflictData.currentTask.title}
                </div>
                <div>
                  <strong>Description:</strong> {conflictData.currentTask.description || "No description"}
                </div>
                <div>
                  <strong>Status:</strong>
                  <Badge variant="secondary" className="ml-2">
                    {conflictData.currentTask.status}
                  </Badge>
                </div>
                <div>
                  <strong>Priority:</strong>
                  <Badge variant="secondary" className="ml-2">
                    {conflictData.currentTask.priority}
                  </Badge>
                </div>
                <div>
                  <strong>Assigned To:</strong> {conflictData.currentTask.assignedToName}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Title:</strong> {conflictData.yourChanges.title}
                </div>
                <div>
                  <strong>Description:</strong> {conflictData.yourChanges.description || "No description"}
                </div>
                <div>
                  <strong>Status:</strong>
                  <Badge variant="secondary" className="ml-2">
                    {conflictData.yourChanges.status}
                  </Badge>
                </div>
                <div>
                  <strong>Priority:</strong>
                  <Badge variant="secondary" className="ml-2">
                    {conflictData.yourChanges.priority}
                  </Badge>
                </div>
                <div>
                  <strong>Assigned To:</strong> {conflictData.yourChanges.assignedToName}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Resolution:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant={selectedResolution === "merge" ? "default" : "outline"}
                onClick={handleMerge}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-semibold">Merge Changes</div>
                  <div className="text-sm text-gray-600">Combine your changes with the current version</div>
                </div>
              </Button>

              <Button
                variant={selectedResolution === "overwrite" ? "default" : "outline"}
                onClick={handleOverwrite}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-semibold">Overwrite</div>
                  <div className="text-sm text-gray-600">Replace the current version with your changes</div>
                </div>
              </Button>
            </div>
          </div>

          {selectedResolution && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Preview of Final Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Title:</strong> {mergedTask.title}
                </div>
                <div>
                  <strong>Description:</strong> {mergedTask.description || "No description"}
                </div>
                <div>
                  <strong>Status:</strong>
                  <Badge variant="secondary" className="ml-2">
                    {mergedTask.status}
                  </Badge>
                </div>
                <div>
                  <strong>Priority:</strong>
                  <Badge variant="secondary" className="ml-2">
                    {mergedTask.priority}
                  </Badge>
                </div>
                <div>
                  <strong>Assigned To:</strong> {mergedTask.assignedToName}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleConfirm} disabled={!selectedResolution} className="flex-1">
              Confirm Resolution
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
