import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { Activity } from "lucide-react"
import { toast } from "sonner"

import { AuditFilter, type AuditFilterValues, type AuditTimeRange } from "@/components/audit/AuditFilter"
import { AuditPagination } from "@/components/audit/AuditPagination"
import { AuditStats } from "@/components/audit/AuditStats"
import { AuditTable } from "@/components/audit/AuditTable"
import { PageContainer } from "@/components/common/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { getAuditLogs, getAuditLogsAll, getAuditOptions } from "@/services/auditService"
import { useAuthStore } from "@/stores/authStore"
import { exportCsv, exportJson } from "@/utils/exportCsv"
import { ACTION_LABELS, type AuditLog } from "@/types/audit"
import { cn } from "@/lib/utils"

/* ---------- URL Query 解析 ---------- */

interface UrlState {
  page: number
  pageSize: number
  filters: AuditFilterValues
}

function parseUrlState(searchParams: URLSearchParams): UrlState {
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = [10, 20, 50].includes(Number(searchParams.get("pageSize")))
    ? Number(searchParams.get("pageSize"))
    : 20
  const time = searchParams.get("time")
  return {
    page,
    pageSize,
    filters: {
      timeRange: ["all", "24h", "7d", "30d"].includes(time ?? "")
        ? (time as AuditTimeRange)
        : "7d",
      username: searchParams.get("user") ?? "ALL",
      action: searchParams.get("action") ?? "ALL",
      serverId: searchParams.get("server") ?? "ALL",
      status: ["success", "failed"].includes(searchParams.get("status") ?? "")
        ? (searchParams.get("status") as "success" | "failed")
        : "all",
    },
  }
}

/* ---------- 详情抽屉 ---------- */

function AuditDetailDrawer({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!log) return null
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                log.status === "success"
                  ? "border-transparent bg-success/15 text-success"
                  : "border-transparent bg-destructive/15 text-destructive"
              )}
            >
              {log.status === "success" ? "成功" : "失败"}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              {log.id}
            </Badge>
          </div>
          <DrawerTitle className="mt-2">{ACTION_LABELS[log.action]}</DrawerTitle>
          <DrawerDescription>
            {new Date(log.createdAt).toLocaleString("zh-CN")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              { label: "操作用户", value: log.username },
              { label: "用户 ID", value: log.userId },
              { label: "资源类型", value: log.resourceType },
              { label: "资源 ID", value: log.resourceId },
              { label: "关联服务器", value: log.serverId ?? "—" },
              { label: "状态", value: log.status === "success" ? "成功" : "失败" },
              { label: "IP 地址", value: log.ip },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-caption text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 break-all font-mono text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-5">
              <p className="text-label mb-2 text-muted-foreground">Metadata</p>
              <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
                {Object.entries(log.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 text-xs">
                    <span className="shrink-0 text-muted-foreground">{key}</span>
                    <span className="break-all font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <p className="text-label mb-2 text-muted-foreground">请求信息</p>
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3 text-xs">
              <p className="text-muted-foreground">User-Agent</p>
              <p className="break-all font-mono">{log.userAgent}</p>
              <p className="mt-2 text-muted-foreground">来源 IP</p>
              <p className="font-mono">{log.ip}</p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/* ---------- 页面主体 ---------- */

/**
 * 审计日志(企业级)
 * - 分页查询(auditService.getAuditLogs,未来映射 GET /api/audit)
 * - 筛选与分页状态持久化到 URL Query(刷新保持)
 * - CSV / JSON 导出(当前筛选全量,异步分块防阻塞)
 * - RBAC:admin 全量 / operator 仅本人 / viewer 无权限(路由守卫)
 */
export function Audit() {
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.hasRole("admin"))
  const [searchParams, setSearchParams] = useSearchParams()

  const state = useMemo(() => parseUrlState(searchParams), [searchParams])
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const scopeUsername = isAdmin ? undefined : currentUser?.username

  const updateState = useCallback(
    (next: Partial<UrlState>) => {
      const params = new URLSearchParams()
      const merged = {
        page: next.page ?? state.page,
        pageSize: next.pageSize ?? state.pageSize,
        filters: { ...state.filters, ...(next.filters ?? {}) },
      }
      params.set("page", String(merged.page))
      params.set("pageSize", String(merged.pageSize))
      params.set("time", merged.filters.timeRange)
      if (merged.filters.username !== "ALL") params.set("user", merged.filters.username)
      if (merged.filters.action !== "ALL") params.set("action", merged.filters.action)
      if (merged.filters.serverId !== "ALL") params.set("server", merged.filters.serverId)
      if (merged.filters.status !== "all") params.set("status", merged.filters.status)
      setSearchParams(params, { replace: true })
    },
    [state, setSearchParams]
  )

  const queryKey = useMemo(
    () => ["audit", scopeUsername, state.filters, state.page, state.pageSize],
    [scopeUsername, state.filters, state.page, state.pageSize]
  )

  /* 分页数据 */
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getAuditLogs({
        page: state.page,
        pageSize: state.pageSize,
        scopeUsername,
        username: state.filters.username,
        action: state.filters.action,
        serverId: state.filters.serverId,
        status: state.filters.status,
        timeRange: state.filters.timeRange,
      }),
    placeholderData: (prev) => prev, // 翻页时保留旧数据,避免闪烁
  })

  /* 统计(基于筛选范围全量,与分页无关) */
  const { data: allData } = useQuery({
    queryKey: ["audit-all", scopeUsername, state.filters],
    queryFn: () =>
      getAuditLogsAll({
        scopeUsername,
        username: state.filters.username,
        action: state.filters.action,
        serverId: state.filters.serverId,
        status: state.filters.status,
        timeRange: state.filters.timeRange,
      }),
  })

  const stats = useMemo(() => {
    const list = allData ?? []
    const today = new Date().toDateString()
    return {
      todayCount: list.filter((l) => new Date(l.createdAt).toDateString() === today).length,
      failed: list.filter((l) => l.status === "failed").length,
      activeUsers: new Set(list.map((l) => l.username)).size,
      critical: list.filter(
        (l) =>
          l.status === "failed" ||
          ["server.delete", "user.role_change", "user.disable", "auth.login_failed"].includes(l.action)
      ).length,
    }
  }, [allData])

  const options = useMemo(() => getAuditOptions(scopeUsername), [scopeUsername])

  /* 导出:当前筛选条件下的全量数据 */
  const handleExport = async (format: "csv" | "json") => {
    if (exporting) return
    setExporting(true)
    try {
      const logs = await getAuditLogsAll({
        scopeUsername,
        username: state.filters.username,
        action: state.filters.action,
        serverId: state.filters.serverId,
        status: state.filters.status,
        timeRange: state.filters.timeRange,
      })
      if (logs.length === 0) {
        toast.warning("当前筛选条件下没有可导出的数据")
        return
      }
      if (format === "csv") {
        await exportCsv(
          [
            ["Time", "User", "Action", "Resource", "Server", "Status", "IP"],
            ...logs.map((l) => [
              new Date(l.createdAt).toISOString(),
              l.username,
              ACTION_LABELS[l.action],
              `${l.resourceType}:${l.resourceId}`,
              l.serverId ?? "-",
              l.status,
              l.ip,
            ]),
          ],
          "audit_logs.csv"
        )
      } else {
        await exportJson(
          logs.map((l) => ({
            action: l.action,
            user: l.username,
            time: l.createdAt,
            resource: `${l.resourceType}:${l.resourceId}`,
            server: l.serverId ?? null,
            status: l.status,
            ip: l.ip,
            metadata: l.metadata ?? null,
          })),
          "audit_logs.json"
        )
      }
      toast.success(`已导出 ${logs.length} 条记录(${format.toUpperCase()})`)
    } catch (err) {
      toast.error("导出失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    } finally {
      setExporting(false)
    }
  }

  const handleFiltersChange = (filters: AuditFilterValues) => {
    updateState({ filters, page: 1 }) // 筛选变更回到第一页
  }

  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-title text-xl">审计日志</h2>
          <p className="text-caption mt-0.5">
            {isAdmin
              ? "平台全部关键操作记录 · 筛选与分页状态保存在 URL"
              : `仅显示本人操作(当前:${currentUser?.username})`}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto gap-1.5">
          <Activity className="h-3 w-3" />
          {data?.total ?? 0} 条匹配
        </Badge>
      </div>

      <AuditStats stats={stats} />

      <Card className="mt-4 p-3">
        <AuditFilter
          values={state.filters}
          onChange={handleFiltersChange}
          options={options}
          resultCount={data?.total ?? 0}
          onExport={handleExport}
          exporting={exporting}
        />
      </Card>

      <Card className="mt-4">
        {isLoading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <AuditTable logs={data?.items ?? []} onView={(log) => { setSelected(log); setDrawerOpen(true) }} />
        )}
        <AuditPagination
          page={state.page}
          pageSize={state.pageSize}
          total={data?.total ?? 0}
          onPageChange={(page) => updateState({ page })}
          onPageSizeChange={(pageSize) => updateState({ pageSize, page: 1 })}
        />
      </Card>

      <AuditDetailDrawer log={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </PageContainer>
  )
}
