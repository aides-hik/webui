import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge"
import { serverApi } from "@/api/server"
import { cn } from "@/lib/utils"
import type { AgentState } from "@/types/agent"

const STATE_META: Record<AgentState, { label: string; tone: StatusTone }> = {
  installed: { label: "Agent 已安装", tone: "success" },
  pending: { label: "等待安装", tone: "warning" },
  uninstalled: { label: "未安装", tone: "neutral" },
}

function formatHeartbeat(iso: string | null): string {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return "刚刚"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  return `${Math.floor(diff / 3_600_000)} 小时前`
}

interface AgentStatusProps {
  serverId: string
  /** 未安装时展示安装引导链接 */
  showInstallHint?: boolean
  className?: string
}

/**
 * Agent 接入状态 — 已安装 / 等待安装 / 未安装 + 版本与心跳
 * 轮询 + WS agent:status 实时更新(与 ConnectionStatus 共享 Query 缓存)
 */
export function AgentStatus({ serverId, showInstallHint = true, className }: AgentStatusProps) {
  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent-status", serverId],
    queryFn: () => serverApi.getAgentStatus(serverId),
    refetchInterval: 5_000,
  })

  if (isLoading || !agent) {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
        <span className="text-xs text-muted-foreground">检测中…</span>
      </span>
    )
  }

  const meta = STATE_META[agent.state]

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={meta.tone} label={meta.label} />
        {agent.version && (
          <span className="font-mono text-[10px] text-muted-foreground">
            v{agent.version}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {agent.state === "installed" ? (
          <>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              心跳 {formatHeartbeat(agent.lastHeartbeat)}
            </span>
            {agent.latencyMs !== null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                延迟 {agent.latencyMs}ms
              </span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-warning" />
            未检测到 Agent 连接
          </span>
        )}
      </div>

      {showInstallHint && agent.state !== "installed" && (
        <p className="text-caption">
          <Link to={`/servers/${serverId}`} className="text-primary hover:underline">
            前往安装 Agent →
          </Link>
        </p>
      )}

      {agent.state === "pending" && (
        <Badge variant="outline" className="text-[10px]">
          令牌有效期内等待注册
        </Badge>
      )}
    </div>
  )
}
