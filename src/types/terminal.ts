/* ============================================================
   Web Terminal 域 — 会话模型与通信协议
   ------------------------------------------------------------
   浏览器(xterm.js) ↔ WebSocket ↔ Terminal Gateway ↔ SSH/Agent
   消息经 WebSocket 主题传输:
   客户端 → 服务端:terminal_open / terminal_input / terminal_resize / terminal_close
   服务端 → 客户端:terminal_output / terminal_session
   ============================================================ */

export type TerminalSessionStatus = "connected" | "closed"

export interface TerminalSession {
  id: string
  serverId: string
  status: TerminalSessionStatus
  /** 会话序号(终端 1 / 终端 2 …) */
  label: string
}

/* ---------- 客户端 → 服务端 ---------- */

export interface TerminalOpenMessage {
  type: "terminal_open"
  sessionId: string
  serverId: string
  cols: number
  rows: number
  /** 操作者(审计用) */
  username?: string
}

export interface TerminalInputMessage {
  type: "terminal_input"
  sessionId: string
  data: string
}

export interface TerminalResizeMessage {
  type: "terminal_resize"
  sessionId: string
  cols: number
  rows: number
}

export interface TerminalCloseMessage {
  type: "terminal_close"
  sessionId: string
}

/* ---------- 服务端 → 客户端 ---------- */

export interface TerminalOutputMessage {
  type: "terminal_output"
  sessionId: string
  data: string
}

export interface TerminalSessionEvent {
  type: "terminal_session"
  sessionId: string
  serverId: string
  status: TerminalSessionStatus
}

/** 终端输入事件(供本地回显与协议发送) */
export interface TerminalInputEvent {
  sessionId: string
  data: string
}
