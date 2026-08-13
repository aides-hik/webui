import { TrendingDown, TrendingUp } from "lucide-react"

import { Sparkline } from "@/components/metrics/ResourceChart"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string
  unit?: string
  /** 相对变化(+/-) */
  delta?: string
  deltaUp?: boolean
  icon?: React.ElementType
  /** 迷你趋势数据 */
  spark?: number[]
  sparkColor?: string
  className?: string
}

/**
 * 指标卡片 — 当前值 + 变化趋势 + 迷你图
 */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaUp,
  icon: Icon,
  spark,
  sparkColor = "text-primary",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("shadow-soft-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          </span>
          {delta && (
            <span
              className={cn(
                "text-caption flex items-center gap-0.5 font-medium",
                deltaUp ? "text-success" : "text-destructive"
              )}
            >
              {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta}
            </span>
          )}
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {value}
          {unit && <span className="ml-0.5 text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
        <p className="text-caption mt-0.5">{label}</p>
        {spark && spark.length > 0 && (
          <div className="mt-3">
            <Sparkline data={spark} colorClass={sparkColor} className="h-8 w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
