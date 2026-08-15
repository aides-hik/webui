import { cn } from "@/lib/utils"

/** 状态语义色:success / warning / danger / neutral */
export type StatusTone = "success" | "warning" | "danger" | "neutral"

const TONE_META: Record<StatusTone, { dot: string; badge: string }> = {
  success: {
    dot: "bg-success",
    badge: "border-transparent bg-success/15 text-success",
  },
  warning: {
    dot: "bg-warning",
    badge: "border-transparent bg-warning/15 text-warning",
  },
  danger: {
    dot: "bg-destructive",
    badge: "border-transparent bg-destructive/15 text-destructive",
  },
  neutral: {
    dot: "bg-muted-foreground/50",
    badge: "border-transparent bg-muted text-muted-foreground",
  },
}

interface StatusBadgeProps {
  tone: StatusTone
  label: string
  /** 字号:xs=text-xs(默认);2xs=text-[10px](表格等紧凑场景) */
  size?: "xs" | "2xs"
  /** 是否显示状态圆点(默认显示;纯文字徽章可关闭) */
  showDot?: boolean
  className?: string
}

/**
 * 状态徽章 — 「语义色圆点 + 半透明底色徽章」的统一实现。
 * 各域状态(服务器/应用/Agent/审计)只负责把业务状态映射为 tone,
 * 视觉样式由本组件单一维护。
 */
export function StatusBadge({
  tone,
  label,
  size = "xs",
  showDot = true,
  className,
}: StatusBadgeProps) {
  const meta = TONE_META[tone]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium",
        size === "xs" ? "text-xs" : "text-[10px]",
        meta.badge,
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      )}
      {label}
    </span>
  )
}
