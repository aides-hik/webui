import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { monitoringApi } from "@/api/monitoring"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { wsService } from "@/services/websocket"
import type { LogEntry, LogLevel } from "@/types/server"
import { cn } from "@/lib/utils"

const LEVEL_FILTERS: (LogLevel | "ALL")[] = ["ALL", "INFO", "WARN", "ERROR"]

const LEVEL_CLASS: Record<LogLevel, string> = {
  INFO: "bg-primary/10 text-primary",
  WARN: "bg-warning/10 text-warning",
  ERROR: "bg-destructive/10 text-destructive",
}

interface LogsViewerProps {
  serverId?: string
  /** 日志区高度(px) */
  height?: number
  /** 是否订阅实时日志流 */
  realtime?: boolean
  className?: string
}

/**
 * 日志查看器 — 级别过滤 / 来源过滤 / 实时流
 * 实时数据:WS logs:stream(Agent 日志通道)
 */
export function LogsViewer({
  serverId,
  height = 420,
  realtime = true,
  className,
}: LogsViewerProps) {
  const { data: initial, isLoading } = useQuery({
    queryKey: ["logs", serverId ?? "platform"],
    queryFn: () => monitoringApi.logs(serverId),
  })

  const [entries, setEntries] = useState<LogEntry[] | null>(null)
  const [level, setLevel] = useState<LogLevel | "ALL">("ALL")
  const [source, setSource] = useState<string>("ALL")
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const list = entries ?? initial ?? []

  // 实时日志流订阅
  useEffect(() => {
    if (!realtime) return
    return wsService.subscribe<LogEntry>("logs:stream", (entry) => {
      setEntries((prev) => [...(prev ?? initial ?? []), entry])
    })
  }, [realtime, initial])

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [list.length, autoScroll, level, source])

  const sources = useMemo(
    () => ["ALL", ...Array.from(new Set(list.map((l) => l.source)))],
    [list]
  )

  const filtered = useMemo(
    () =>
      list.filter(
        (l) =>
          (level === "ALL" || l.level === level) &&
          (source === "ALL" || l.source === source)
      ),
    [list, level, source]
  )

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <div className="flex gap-1.5">
          {LEVEL_FILTERS.map((lv) => (
            <Button
              key={lv}
              size="sm"
              variant={level === lv ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setLevel(lv)}
            >
              {lv}
              {lv !== "ALL" && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {list.filter((l) => l.level === lv).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-7 rounded-md border bg-background px-2 text-xs text-muted-foreground outline-none"
          aria-label="来源过滤"
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "全部来源" : s}
            </option>
          ))}
        </select>

        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="h-3 w-3"
          />
          自动滚动
        </label>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => {
            setEntries(null)
            toast.success("日志已刷新")
          }}
        >
          <RefreshCw />
          刷新
        </Button>
      </div>

      {/* 日志区 */}
      {isLoading && !entries ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="overflow-y-auto font-mono text-xs"
          style={{ height }}
        >
          <div className="divide-y">
            {filtered.length === 0 && (
              <p className="text-caption py-10 text-center">暂无匹配日志</p>
            )}
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 px-4 py-2 hover:bg-muted/40"
              >
                <span className="shrink-0 text-muted-foreground/70">{entry.time}</span>
                <Badge
                  className={cn(
                    "mt-[1px] shrink-0 px-1.5 py-0 text-[10px]",
                    LEVEL_CLASS[entry.level]
                  )}
                >
                  {entry.level}
                </Badge>
                <span className="w-16 shrink-0 text-muted-foreground">
                  {entry.source}
                </span>
                <span className="min-w-0 break-all">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
