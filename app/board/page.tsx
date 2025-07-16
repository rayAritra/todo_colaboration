import { redirect } from "next/navigation"
import { verifySession } from "@/lib/auth"
import KanbanBoard from "@/components/kanban-board"
import ActivityLog from "@/components/activity-log"
import Header from "@/components/header"

export default async function BoardPage() {
  const session = await verifySession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header user={session.user} />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <KanbanBoard userId={session.user.id} />
          </div>
          <div className="lg:col-span-1">
            <ActivityLog />
          </div>
        </div>
      </div>
    </div>
  )
}
