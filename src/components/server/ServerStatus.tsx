import { cn } from "@/lib/utils"
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge"
import type { ServerStatus as ServerStatusType } from "@/types/server"

const STATUS_META: Record<ServerStatusType, { label: string; tone: StatusTone }> = {
  online: { label: "在线", tone: "success" },
  offline: { label: "离线", tone: "neutral" },
  maintenance: { label: "维护中", tone: "warning" },
  degraded: { label: "降级", tone: "warning" },
}

/** 服务器运行状态指示(圆点 + 文字) */
export function ServerStatus({
  status,
  className,
}: {
  status: ServerStatusType
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.tone === "success" ? "bg-success" : meta.tone === "warning" ? "bg-warning" : "bg-muted-foreground/50")} aria-hidden />
      <span className="text-xs font-medium text-muted-foreground">
        {meta.label}
      </span>
    </span>
  )
}

/** 状态徽章(表格/卡片中使用) */
export function ServerStatusBadge({ status }: { status: ServerStatusType }) {
  const meta = STATUS_META[status]
  return <StatusBadge tone={meta.tone} label={meta.label} />
}

/** 资源使用率对应的颜色(按阈值) */
export function resourceBarColor(value: number): string {
  if (value >= 85) return "bg-destructive"
  if (value >= 60) return "bg-warning"
  return "bg-success"
}

/** 资源进度条(CPU / Memory / Disk) */
export function ResourceBar({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", resourceBarColor(value))}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}
