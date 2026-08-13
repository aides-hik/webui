/* ============================================================
   useTerminal — 终端会话 Hook
   ------------------------------------------------------------
   职责:WebSocket 连接、消息发送、输出接收、Session 管理
   架构:浏览器(xterm.js) → WebSocket → Terminal Gateway → SSH/Agent
   当前运行于 Mock 通道(wsService 未配置 URL 时转接 mockServer),
   接入真实后端只需配置 VITE_WS_URL,本 Hook 无需改动。
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react"
import type { Terminal } from "@xterm/xterm"

import { wsService } from "@/services/websocket"
import { useAuthStore } from "@/stores/authStore"
import type {
  TerminalInputEvent,
  TerminalOutputMessage,
  TerminalSessionStatus,
} from "@/types/terminal"

interface UseTerminalOptions {
  serverId: string
  /** 由外部(TerminalTabs)指定的会话 ID;缺省时自动生成 */
  sessionId?: string
}

export interface TerminalHandle {
  sessionId: string | null
  status: TerminalSessionStatus
  /** 将 xterm 实例与 FitAddon 注册到 Hook(连接后接收输出) */
  attach: (term: Terminal, fit: { fit: () => void }) => void
  connect: () => void
  disconnect: () => void
  sendCommand: (data: string) => void
  resize: (cols: number, rows: number) => void
}

export function useTerminal({ serverId, sessionId: fixedSessionId }: UseTerminalOptions): TerminalHandle {
  const [sessionId, setSessionId] = useState<string | null>(fixedSessionId ?? null)
  const [status, setStatus] = useState<TerminalSessionStatus>("connected")

  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<{ fit: () => void } | null>(null)
  const sessionIdRef = useRef<string | null>(fixedSessionId ?? null)

  const effectiveSessionId = fixedSessionId ?? sessionId

  /* 输出订阅:服务端输出 → xterm */
  useEffect(() => {
    if (!effectiveSessionId) return
    return wsService.subscribe<TerminalOutputMessage>("terminal:output", (msg) => {
      if (msg.sessionId === effectiveSessionId) {
        termRef.current?.write(msg.data)
      }
    })
  }, [effectiveSessionId])

  /* 会话状态订阅 */
  useEffect(() => {
    if (!effectiveSessionId) return
    return wsService.subscribe<{ sessionId: string; status: TerminalSessionStatus }>(
      "terminal:session",
      (msg) => {
        if (msg.sessionId === effectiveSessionId) {
          setStatus(msg.status)
        }
      }
    )
  }, [effectiveSessionId])

  const attach = useCallback((term: Terminal, fit: { fit: () => void }) => {
    termRef.current = term
    fitRef.current = fit
  }, [])

  const connect = useCallback(() => {
    const id = fixedSessionId ?? sessionIdRef.current ?? `sess-${Date.now().toString(36)}`
    sessionIdRef.current = id
    setSessionId(id)
    setStatus("connected")
    const cols = termRef.current?.cols ?? 80
    const rows = termRef.current?.rows ?? 24
    wsService.send("terminal:open", {
      type: "terminal_open",
      sessionId: id,
      serverId,
      cols,
      rows,
      username: useAuthStore.getState().user?.username ?? "unknown",
    })
  }, [fixedSessionId, serverId])

  const disconnect = useCallback(() => {
    if (sessionIdRef.current) {
      wsService.send("terminal:close", {
        type: "terminal_close",
        sessionId: sessionIdRef.current,
      })
    }
  }, [])

  const sendCommand = useCallback((data: string) => {
    if (!sessionIdRef.current) return
    wsService.send("terminal:input", {
      type: "terminal_input",
      sessionId: sessionIdRef.current,
      data,
    } satisfies TerminalInputEvent & { type: string })
  }, [])

  const resize = useCallback((cols: number, rows: number) => {
    if (!sessionIdRef.current) return
    wsService.send("terminal:resize", {
      type: "terminal_resize",
      sessionId: sessionIdRef.current,
      cols,
      rows,
    })
    // 容器尺寸变化后重新适配
    fitRef.current?.fit()
  }, [])

  /* 挂载时自动连接,卸载时关闭会话 */
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    sessionId: effectiveSessionId,
    status,
    attach,
    connect,
    disconnect,
    sendCommand,
    resize,
  }
}
