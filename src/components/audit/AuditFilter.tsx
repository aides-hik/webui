import { AuditExport } from "@/components/audit/AuditExport"
import { Button } from "@/components/ui/button"

export type AuditTimeRange = "all" | "24h" | "7d" | "30d"
export type AuditStatusFilter = "all" | "success" | "failed"

export interface AuditFilterValues {
  timeRange: AuditTimeRange
  username: string // ALL 或用户名
  action: string // ALL 或 actionId
  serverId: string // ALL 或 serverId
  status: AuditStatusFilter
}

interface AuditFilterProps {
  values: AuditFilterValues
  onChange: (values: AuditFilterValues) => void
  /** 筛选选项 */
  options: {
    users: string[]
    actions: { value: string; label: string }[]
    servers: string[]
  }
  resultCount: number
  onExport: (format: "csv" | "json") => void
  exporting: boolean
}

const TIME_OPTIONS: { value: AuditTimeRange; label: string }[] = [
  { value: "all", label: "全部时间" },
  { value: "24h", label: "最近 24 小时" },
  { value: "7d", label: "最近 7 天" },
  { value: "30d", label: "最近 30 天" },
]

const STATUS_OPTIONS: { value: AuditStatusFilter; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "success", label: "成功" },
  { value: "failed", label: "失败" },
]

const selectStyle =
  "h-8 rounded-md border bg-background px-2 text-xs text-muted-foreground outline-none"

/**
 * 审计筛选栏(受控组件,状态由 URL Query 驱动)
 */
export function AuditFilter({ values, onChange, options, resultCount, onExport, exporting }: AuditFilterProps) {
  const set = <K extends keyof AuditFilterValues>(key: K, value: AuditFilterValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={values.timeRange}
        onChange={(e) => set("timeRange", e.target.value as AuditTimeRange)}
        className={selectStyle}
        aria-label="时间范围"
      >
        {TIME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={values.username}
        onChange={(e) => set("username", e.target.value)}
        className={selectStyle}
        aria-label="用户"
      >
        <option value="ALL">全部用户</option>
        {options.users.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <select
        value={values.action}
        onChange={(e) => set("action", e.target.value)}
        className={selectStyle}
        aria-label="操作类型"
      >
        <option value="ALL">全部操作</option>
        {options.actions.map((a) => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>

      <select
        value={values.serverId}
        onChange={(e) => set("serverId", e.target.value)}
        className={selectStyle}
        aria-label="服务器"
      >
        <option value="ALL">全部服务器</option>
        {options.servers.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={values.status}
        onChange={(e) => set("status", e.target.value as AuditStatusFilter)}
        className={selectStyle}
        aria-label="状态"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-muted-foreground"
        onClick={() =>
          onChange({
            timeRange: "7d",
            username: "ALL",
            action: "ALL",
            serverId: "ALL",
            status: "all",
          })
        }
      >
        重置
      </Button>

      <span className="ml-auto text-caption">{resultCount} 条结果</span>

      <AuditExport onExport={onExport} exporting={exporting} />
    </div>
  )
}
