import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Terminal } from "@/components/terminal/Terminal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TerminalSession } from "@/types/terminal"

interface TerminalTabsProps {
  serverId: string
  serverName: string
  className?: string
}

const MAX_SESSIONS = 4

let sessionSeq = 0

function createSession(serverId: string): TerminalSession {
  sessionSeq += 1
  return {
    id: `sess-${Date.now().toString(36)}-${sessionSeq}`,
    serverId,
    status: "connected",
    label: `终端 ${sessionSeq}`,
  }
}

/**
 * 多终端会话管理 — 类似 VS Code Terminal 的 Tabs
 * 每个 Tab 独立 xterm 实例 + 独立 WebSocket 会话
 */
export function TerminalTabs({ serverId, serverName, className }: TerminalTabsProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>(() => [
    createSession(serverId),
  ])
  const [activeId, setActiveId] = useState<string>(sessions[0].id)

  const addSession = () => {
    if (sessions.length >= MAX_SESSIONS) return
    const session = createSession(serverId)
    setSessions((prev) => [...prev, session])
    setActiveId(session.id)
  }

  const closeSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (id === activeId && next.length > 0) {
        setActiveId(next[next.length - 1].id)
      }
      return next
    })
  }

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0]

  return (
    <div className={cn("space-y-2", className)}>
      {/* 会话 Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {sessions.map((session) => (
          <span
            key={session.id}
            role="tab"
            aria-selected={session.id === activeId}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors",
              session.id === activeId
                ? "bg-card text-foreground shadow-soft-sm"
                : "cursor-pointer border-transparent text-muted-foreground hover:bg-muted/60"
            )}
            onClick={() => setActiveId(session.id)}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                session.status === "connected" ? "bg-success" : "bg-destructive"
              )}
              aria-hidden
            />
            {session.label}
            <button
              className="ml-0.5 rounded p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                closeSession(session.id)
              }}
              aria-label={`关闭${session.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {sessions.length < MAX_SESSIONS && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={addSession}
          >
            <Plus className="h-3 w-3" />
            新建
          </Button>
        )}
      </div>

      {/* 激活会话的终端(切换时重建,服务端重放历史输出) */}
      {active && (
        <Terminal
          key={active.id}
          serverId={serverId}
          serverName={serverName}
          sessionId={active.id}
          height={400}
        />
      )}
    </div>
  )
}
