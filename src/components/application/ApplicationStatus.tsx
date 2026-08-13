import { cn } from "@/lib/utils"
import type { ApplicationStatus } from "@/types/application"

const STATUS_META: Record<ApplicationStatus, { label: string; dot: string; badge: string }> = {
  running: {
    label: "运行中",
    dot: "bg-success",
    badge: "border-transparent bg-success/15 text-success",
  },
  stopped: {
    label: "已停止",
    dot: "bg-muted-foreground/50",
    badge: "border-transparent bg-muted text-muted-foreground",
  },
  failed: {
    label: "失败",
    dot: "bg-destructive",
    badge: "border-transparent bg-destructive/15 text-destructive",
  },
}

/** 应用状态徽章 */
export function ApplicationStatus({ status }: { status: ApplicationStatus }) {
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
