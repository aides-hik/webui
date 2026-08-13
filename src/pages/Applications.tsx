import { useMemo, useState } from "react"
import { AppWindow } from "lucide-react"

import { ApplicationTable } from "@/components/application/ApplicationTable"
import { PageContainer } from "@/components/common/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { applications as initialApplications } from "@/lib/mock-data"
import type { Application, ApplicationAction, ApplicationStatus } from "@/types/application"

/**
 * 应用管理 — 部署在服务器上的应用
 */
export function Applications() {
  const [list, setList] = useState<Application[]>(initialApplications)

  const stats = useMemo(() => {
    const running = list.filter((a) => a.status === "running").length
    const failed = list.filter((a) => a.status === "failed").length
    return { total: list.length, running, failed }
  }, [list])

  const handleStatusChange = (app: Application, action: ApplicationAction) => {
    setList((prev) =>
      prev.map((a) => {
        if (a.id !== app.id) return a
        const status: ApplicationStatus =
          action === "start" ? "running" : action === "stop" ? "stopped" : a.status === "running" ? "stopped" : "running"
        return { ...a, status, updatedAt: "刚刚" }
      })
    )
  }

  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-title text-xl">应用</h2>
          <p className="text-caption mt-0.5">
            {stats.total} 个应用 · {stats.running} 运行中 · {stats.failed} 失败
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AppWindow className="h-4 w-4 text-muted-foreground" />
            应用列表
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ApplicationTable applications={list} onStatusChange={handleStatusChange} />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
