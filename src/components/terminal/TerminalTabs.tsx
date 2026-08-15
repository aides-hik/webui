import { useEffect, useState } from "react"
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

/**
 * 会话 id 计数器:仅用于保证 id 唯一,与展示编号无关。
 * 展示编号由当前已打开会话派生(见 nextNumber),关闭会话后编号会被复用。
 */
let sessionSeq = 0

function createSession(serverId: string, number: number): TerminalSession {
  sessionSeq += 1
  return {
    id: `sess-${Date.now().toString(36)}-${sessionSeq}`,
    serverId,
    status: "connected",
    label: `终端 ${number}`,
  }
}

/* ---------- 会话状态跨导航保持 ----------
   TerminalTabs 挂在 /servers/:id/terminal 路由下,离开页面组件即卸载,
   本地 state 随之销毁。这里用模块级缓存按 serverId 保存会话与激活项,
   返回页面时恢复,避免「新建多个会话 → 跳转其它页 → 返回」后只剩一个。 */
const sessionCache = new Map<string, TerminalSession[]>()
const activeCache = new Map<string, string | null>()

/** 读取某服务器的会话缓存;无缓存或已全部关闭时创建初始会话 */
function loadSessions(serverId: string): TerminalSession[] {
  const cached = sessionCache.get(serverId)
  if (cached && cached.length > 0) return cached
  const fresh = [createSession(serverId, 1)]
  sessionCache.set(serverId, fresh)
  return fresh
}

/**
 * 多终端会话管理 — 类似 VS Code Terminal 的 Tabs
 * 每个 Tab 独立 xterm 实例 + 独立 WebSocket 会话
 */
export function TerminalTabs({ serverId, serverName, className }: TerminalTabsProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>(() =>
    loadSessions(serverId)
  )
  const [activeId, setActiveId] = useState<string | null>(() =>
    activeCache.get(serverId) ?? null
  )

  /* 会话与激活状态同步回缓存(组件卸载后由 loadSessions 恢复) */
  useEffect(() => {
    sessionCache.set(serverId, sessions)
    activeCache.set(serverId, activeId)
  }, [serverId, sessions, activeId])

  /** 当前已占用的会话编号 */
  const usedNumbers = new Set(
    sessions
      .map((s) => s.label.match(/^终端 (\d+)$/)?.[1])
      .filter((n): n is string => n !== undefined)
      .map(Number)
  )

  /** 最小空闲编号:关闭会话后释放的编号可被复用,编号不会无限累加 */
  const nextNumber = () => {
    let n = 1
    while (usedNumbers.has(n)) n += 1
    return n
  }

  const addSession = () => {
    if (sessions.length >= MAX_SESSIONS) return
    const session = createSession(serverId, nextNumber())
    setSessions((prev) => [...prev, session])
    setActiveId(session.id)
  }

  const closeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  /**
   * 激活会话:显式选择(activeId)优先;
   * 当 activeId 失效(如刚被关闭)时回落到最后一个会话;
   * 无会话时为 null。
   * 注意:activeId 不能直接用 sessions[0].id 初始化 ——
   * useState 参数每次渲染都会求值,关闭最后一个会话后
   * sessions[0] 为 undefined 会抛错(曾引发线上崩溃)。
   */
  const active =
    sessions.find((s) => s.id === activeId) ??
    sessions[sessions.length - 1] ??
    null

  return (
    <div className={cn("space-y-2", className)}>
      {/* 会话 Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {sessions.map((session) => (
          <span
            key={session.id}
            role="tab"
            aria-selected={session.id === active?.id}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors",
              session.id === active?.id
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
