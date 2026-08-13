import { cn } from "@/lib/utils"
import type { ServerStatus as ServerStatusType } from "@/lib/mock-data"

const STATUS_META: Record<
  ServerStatusType,
  { label: string; dot: string; badge: string }
> = {
  online: {
    label: "在线",
    dot: "bg-success",
    badge: "border-transparent bg-success/15 text-success",
  },
  offline: {
    label: "离线",
    dot: "bg-muted-foreground/50",
    badge: "border-transparent bg-muted text-muted-foreground",
  },
  maintenance: {
    label: "维护中",
    dot: "bg-warning",
    badge: "border-transparent bg-warning/15 text-warning",
  },
  degraded: {
    label: "降级",
    dot: "bg-warning",
    badge: "border-transparent bg-warning/15 text-warning",
  },
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
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      <span className="text-xs font-medium text-muted-foreground">
        {meta.label}
      </span>
    </span>
  )
}

/** 状态徽章(表格/卡片中使用) */
export function ServerStatusBadge({ status }: { status: ServerStatusType }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        meta.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
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
