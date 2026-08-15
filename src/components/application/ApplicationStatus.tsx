import { StatusBadge, type StatusTone } from "@/components/ui/status-badge"
import type { ApplicationStatus as ApplicationStatusType } from "@/types/application"

const STATUS_TONE: Record<ApplicationStatusType, { label: string; tone: StatusTone }> = {
  running: { label: "运行中", tone: "success" },
  stopped: { label: "已停止", tone: "neutral" },
  failed: { label: "失败", tone: "danger" },
}

/** 应用状态徽章 */
export function ApplicationStatus({ status }: { status: ApplicationStatusType }) {
  const meta = STATUS_TONE[status]
  return <StatusBadge tone={meta.tone} label={meta.label} />
}
