/* ============================================================
   WebSocket 服务(预留架构)
   ------------------------------------------------------------
   - 连接管理:connect / disconnect
   - 主题订阅:subscribe(topic, handler) → unsubscribe
   - 消息发送:send(topic, payload)
   - 自动重连(指数退避)+ 心跳保活
   - Mock 模式:未配置 VITE_WS_URL 时,subscribe 自动转接
     mockServer 事件总线 —— 调用方代码与真实 WS 完全一致,
     接入真实后端只需配置 VITE_WS_URL
   ============================================================ */

import { mockServer } from "@/services/mockServer"

export type WsTopic =
  | "servers:update"
  | "metrics:update"
  | "container:update"
  | "logs:stream"
  | "agent:status"
  | "terminal:open"
  | "terminal:input"
  | "terminal:resize"
  | "terminal:close"
  | "terminal:output"
  | "terminal:session"

type Handler<T = unknown> = (data: T) => void

const WS_URL = import.meta.env.VITE_WS_URL as string | undefined
const HEARTBEAT_MS = 30_000
const MAX_RECONNECT_ATTEMPTS = 10

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string | null = null
  private handlers = new Map<string, Set<Handler>>()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private shouldReconnect = false

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /** 建立连接;未配置 VITE_WS_URL 时进入 Mock 模式 */
  connect(url?: string) {
    this.url = url ?? WS_URL ?? null

    if (!this.url) {
      console.info("[ws] Mock 模式:订阅将转接 mockServer 事件总线")
      return
    }

    this.shouldReconnect = true
    this.open()
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.ws?.close()
    this.ws = null
  }

  private open() {
    try {
      const ws = new WebSocket(this.url!)
      this.ws = ws

      ws.onopen = () => {
        this.reconnectAttempts = 0
        this.startHeartbeat()
        // 重连成功后重新订阅
        this.handlers.forEach((_, topic) => this.send("subscribe", { topic }))
      }

      ws.onmessage = (event) => this.handleMessage(event)

      ws.onclose = () => {
        this.stopHeartbeat()
        if (this.shouldReconnect) this.scheduleReconnect()
      }

      ws.onerror = () => {
        // onclose 会随后触发并处理重连
      }
    } catch {
      if (this.shouldReconnect) this.scheduleReconnect()
    }
  }

  /** 指数退避重连 */
  private scheduleReconnect() {
    if (this.reconnectTimer) return
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("[ws] 重连次数超限,停止自动重连")
      return
    }
    const backoff = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000)
    this.reconnectAttempts += 1
    console.info(`[ws] ${backoff}ms 后重连(第 ${this.reconnectAttempts} 次)`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.open()
    }, backoff)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) this.send("ping", { ts: Date.now() })
    }, HEARTBEAT_MS)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  /**
   * 订阅主题。
   * Mock 模式:转接 mockServer 事件总线(返回其退订函数)。
   * 真实模式:本地注册 + 发送订阅消息。
   */
  subscribe<T>(topic: WsTopic, handler: Handler<T>): () => void {
    if (!this.url) {
      return mockServer.on(topic, handler as Handler)
    }

    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set())
    this.handlers.get(topic)!.add(handler as Handler)
    this.send("subscribe", { topic })

    return () => {
      this.handlers.get(topic)?.delete(handler as Handler)
    }
  }

  /** 发送消息(未连接时静默丢弃;Mock 模式直接注入事件总线) */
  send<T>(topic: string, payload?: T) {
    if (!this.url) {
      // Mock 模式:注入 mockServer 事件总线,形成双向通道
      mockServer.emit(topic, payload)
      return
    }
    if (!this.connected) return
    this.ws?.send(JSON.stringify({ topic, payload }))
  }

  private handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data as string)
      if (!msg || typeof msg.topic !== "string") return
      if (msg.topic === "pong") return
      this.handlers.get(msg.topic)?.forEach((handler) => handler(msg.payload))
    } catch {
      // 忽略非 JSON 消息
    }
  }
}

/** 单例:应用启动时连接(Mock 模式无需真实连接) */
export const wsService = new WebSocketService()
wsService.connect()
