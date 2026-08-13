import { motion } from "framer-motion"
import { AlertTriangle, CalendarDays, Users, XCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface AuditStatsData {
  todayCount: number
  failed: number
  activeUsers: number
  critical: number
}

/**
 * 审计统计卡 — Framer Motion hover 微动画
 */
export function AuditStats({ stats }: { stats: AuditStatsData }) {
  const cards = [
    { label: "今日事件", value: stats.todayCount, icon: CalendarDays, color: "text-primary" },
    { label: "失败操作", value: stats.failed, icon: XCircle, color: "text-destructive" },
    { label: "活跃用户", value: stats.activeUsers, icon: Users, color: "text-success" },
    { label: "严重事件", value: stats.critical, icon: AlertTriangle, color: "text-warning" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut" }}
          whileHover={{ y: -3 }}
        >
          <Card className="shadow-soft-sm transition-shadow hover:shadow-soft">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                <card.icon className={cn("h-4 w-4", card.color)} />
              </span>
              <div>
                <p className="text-xl font-semibold leading-tight">{card.value}</p>
                <p className="text-caption">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
