import { RefreshCw, Rocket, Settings, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ActivityEvent, ActivityType } from "@/types/server"

const TYPE_META: Record<ActivityType, { icon: React.ElementType; color: string; badge: string; label: string }> = {
  reboot: { icon: RefreshCw, color: "text-primary", badge: "bg-primary/10 text-primary", label: "重启" },
  deploy: { icon: Rocket, color: "text-success", badge: "bg-success/10 text-success", label: "部署" },
  login: { icon: User, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground", label: "登录" },
  config: { icon: Settings, color: "text-warning", badge: "bg-warning/10 text-warning", label: "配置" },
  warning: { icon: Settings, color: "text-destructive", badge: "bg-destructive/10 text-destructive", label: "告警" },
}

/**
 * 最近活动时间线
 */
export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  return (
    <ol className="relative space-y-1">
      {events.map((event, i) => {
        const meta = TYPE_META[event.type]
        return (
          <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* 时间线 */}
            {i < events.length - 1 && (
              <span
                className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-border"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-border",
                meta.color
              )}
            >
              <meta.icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{event.title}</p>
                <Badge className={cn("px-1.5 py-0 text-[10px]", meta.badge)}>
                  {meta.label}
                </Badge>
              </div>
              <p className="text-caption mt-0.5">{event.description}</p>
              <p className="text-caption mt-0.5 text-muted-foreground/60">
                {event.time}
                {event.server && ` · ${event.server}`}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
