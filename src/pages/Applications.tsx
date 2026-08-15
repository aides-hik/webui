import { useEffect, useMemo, useState } from "react"
import { AppWindow } from "lucide-react"
import { toast } from "sonner"

import { applicationApi } from "@/api/application"
import { ApplicationTable } from "@/components/application/ApplicationTable"
import { PageContainer } from "@/components/common/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Application, ApplicationAction } from "@/types/application"

/**
 * 应用管理 — 部署在服务器上的应用
 * 数据:applicationApi(Mock/Real 自动切换)
 */
export function Applications() {
  const [list, setList] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    applicationApi
      .list()
      .then((apps) => {
        if (!cancelled) setList(apps)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error("加载应用列表失败", {
            description: err instanceof Error ? err.message : "未知错误",
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const running = list.filter((a) => a.status === "running").length
    const failed = list.filter((a) => a.status === "failed").length
    return { total: list.length, running, failed }
  }, [list])

  const handleStatusChange = async (app: Application, action: ApplicationAction) => {
    try {
      const updated = await applicationApi.changeStatus(app.id, action)
      setList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (err) {
      toast.error("操作失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
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
          {loading && list.length === 0 ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ApplicationTable applications={list} onStatusChange={handleStatusChange} />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
