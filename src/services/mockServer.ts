/* ============================================================
   Mock 后端服务
   ------------------------------------------------------------
   模拟真实后端行为:
   - 与 api/server.ts / api/monitoring.ts 完全同签名
   - 定时器驱动实时数据(资源抖动 / 状态漂移 / 指标序列)
   - 事件总线 emit/on,websocket.ts 在 Mock 模式下转接
   未来接入真实后端:删除本模块引用,配置 VITE_API_BASE_URL 即可
   ============================================================ */

import {
  activityEvents,
  cpuHistory,
  dockerContainers,
  executeMockCommand,
  historyLabels,
  logEntries,
  memoryHistory,
  networkInHistory,
  networkOutHistory,
  servers as seedServers,
} from "@/lib/mock-data"
import { recordAudit } from "@/services/mockAudit"
import type { ServerApi } from "@/api/server"
import type { MonitoringApi } from "@/api/monitoring"
import type { AgentStatus, AgentToken } from "@/types/agent"
import type { Container } from "@/types/docker"
import type { MetricsRange, MetricsSnapshot } from "@/types/metrics"
import type {
  TerminalCloseMessage,
  TerminalInputMessage,
  TerminalOpenMessage,
  TerminalResizeMessage,
} from "@/types/terminal"
import type {
  LogEntry,
  LogLevel,
  NewServerInput,
  Paginated,
  Server,
  ServerListParams,
} from "@/types/server"

const TICK_MS = 3_000 // 实时数据刷新间隔
const MAX_POINTS = 120 // 指标序列最大长度
const POINTS_BY_RANGE: Record<MetricsRange, number> = {
  "1h": 20,
  "6h": 60,
  "24h": MAX_POINTS,
}

const delay = (ms = 150 + Math.random() * 300) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

type Listener = (data: unknown) => void

class MockServer {
  private servers: Server[] = seedServers.map((s) => ({ ...s }))
  private containers: Container[] = dockerContainers.map((c) => ({ ...c }))

  /* Agent 注册表:serverId → agent 状态 */
  private agents = new Map<
    string,
    { state: "installed" | "pending" | "uninstalled"; version: string | null; lastHeartbeat: string | null; token: string | null }
  >()

  /* 实时日志缓冲 */
  private logs: LogEntry[] = [...logEntries]
  private logCounter = 0

  /* 终端会话:sessionId → 会话状态 */
  private terminals = new Map<
    string,
    { serverId: string; status: "connected" | "closed"; buffer: string; history: string[]; username: string }
  >()
  private terminalSeq = 0

  /* 审计记录 */
  private audit = (input: Omit<Parameters<typeof recordAudit>[0], "userId">) => {
    recordAudit({ ...input, userId: "-" })
  }

  /* 实时指标序列(内存环形缓冲) */
  private cpu: number[] = [...cpuHistory]
  private memory: number[] = [...memoryHistory]
  private networkIn: number[] = [...networkInHistory]
  private networkOut: number[] = [...networkOutHistory]
  private labels: string[] = [...historyLabels]

  private listeners = new Map<string, Set<Listener>>()
  private timer: ReturnType<typeof setInterval> | null = null
  private started = false

  /* ---------- 生命周期 ---------- */

  start() {
    if (this.started) return
    this.started = true
    // 预置已安装 Agent 的服务器
    for (const id of ["srv-prod-web-01", "srv-prod-api-01", "srv-edge-lb-01", "srv-cache-01"]) {
      this.agents.set(id, {
        state: "installed",
        version: "1.4.2",
        lastHeartbeat: new Date().toISOString(),
        token: null,
      })
    }
    this.timer = setInterval(() => this.tick(), TICK_MS)
    console.info("[mock-server] 实时数据模拟已启动(每 3s 刷新)")

    // 终端协议监听(WebSocket mock 通道)
    this.on("terminal:open", (msg) => this.handleTerminalOpen(msg as TerminalOpenMessage))
    this.on("terminal:input", (msg) => this.handleTerminalInput(msg as TerminalInputMessage))
    this.on("terminal:resize", (msg) => this.handleTerminalResize(msg as TerminalResizeMessage))
    this.on("terminal:close", (msg) => this.handleTerminalClose(msg as TerminalCloseMessage))
  }

  /* ---------- 终端后端(模拟 Terminal Gateway) ---------- */

  private handleTerminalOpen(msg: TerminalOpenMessage) {
    const existing = this.terminals.get(msg.sessionId)
    if (existing) {
      // 会话重连:重放历史输出
      existing.status = "connected"
      existing.username = msg.username ?? existing.username
      for (const line of existing.history) {
        this.emit("terminal:output", { sessionId: msg.sessionId, data: line })
      }
      this.emit("terminal:session", {
        sessionId: msg.sessionId,
        serverId: msg.serverId,
        status: "connected",
      })
      return
    }

    this.terminalSeq += 1
    const server = this.servers.find((s) => s.id === msg.serverId)
    const hostname = server?.hostname ?? "server"
    const welcome = [
      `WebUI Terminal Gateway v1.0 (mock) · 已连接 ${hostname}`,
      "支持命令:help · uptime · df -h · free -m · docker ps · ls · echo <text> · date · clear",
      "输入命令后回车执行。",
      "",
      `admin@${hostname}:~$ `,
    ]
    this.terminals.set(msg.sessionId, {
      serverId: msg.serverId,
      status: "connected",
      buffer: "",
      history: welcome.map((l) => `${l}\r\n`),
      username: msg.username ?? "unknown",
    })
    this.audit({
      username: msg.username ?? "unknown",
      action: "terminal.open",
      resourceType: "terminal",
      resourceId: msg.sessionId,
      serverId: msg.serverId,
      metadata: { hostname },
    })
    for (const line of welcome) {
      this.emit("terminal:output", { sessionId: msg.sessionId, data: `${line}\r\n` })
    }
    this.emit("terminal:session", {
      sessionId: msg.sessionId,
      serverId: msg.serverId,
      status: "connected",
    })
  }

  private handleTerminalInput(msg: TerminalInputMessage) {
    const session = this.terminals.get(msg.sessionId)
    if (!session || session.status !== "connected") return

    for (const ch of msg.data) {
      if (ch === "\r" || ch === "\n") {
        const line = session.buffer
        session.buffer = ""
        this.emit("terminal:output", { sessionId: msg.sessionId, data: "\r\n" })
        if (!line.trim()) continue
        const output = executeMockCommand(line)
        if (output === "\u0000CLEAR") {
          session.history = []
          this.emit("terminal:output", { sessionId: msg.sessionId, data: "\u001b[2J\u001b[H" })
          this.emit("terminal:output", { sessionId: msg.sessionId, data: "admin@server:~$ \r\n" })
        } else {
          const block = `${output}\r\nadmin@server:~$ `
          session.history.push(`${line}\r\n${output}\r\n`)
          this.audit({
            username: session.username,
            action: "terminal.command",
            resourceType: "terminal",
            resourceId: msg.sessionId,
            serverId: session.serverId,
            metadata: { command: line },
          })
          this.emit("terminal:output", { sessionId: msg.sessionId, data: block })
        }
      } else if (ch === "\u007f" || ch === "\b") {
        if (session.buffer.length > 0) {
          session.buffer = session.buffer.slice(0, -1)
          this.emit("terminal:output", { sessionId: msg.sessionId, data: "\b \b" })
        }
      } else {
        session.buffer += ch
      }
    }
  }

  private handleTerminalResize(msg: TerminalResizeMessage) {
    // Gateway 层记录窗口尺寸(真实场景透传给 PTY)
    const session = this.terminals.get(msg.sessionId)
    if (session) {
      session.buffer = session.buffer // 尺寸不影响 mock 逻辑,预留透传位
    }
  }

  private handleTerminalClose(msg: TerminalCloseMessage) {
    const session = this.terminals.get(msg.sessionId)
    if (session) {
      session.status = "closed"
    }
    this.emit("terminal:session", {
      sessionId: msg.sessionId,
      serverId: session?.serverId ?? "",
      status: "closed",
    })
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.started = false
  }

  /* ---------- 事件总线(供 WebSocket mock 转接) ---------- */

  on(topic: string, handler: Listener): () => void {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set())
    this.listeners.get(topic)!.add(handler)
    return () => {
      this.listeners.get(topic)?.delete(handler)
    }
  }

  /** 事件广播(WebSocket mock 通道与内部使用) */
  emit(topic: string, data: unknown) {
    this.listeners.get(topic)?.forEach((handler) => handler(data))
  }

  /* ---------- 定时器 tick:模拟实时变化 ---------- */

  private tick() {
    const now = new Date()
    const label = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    // 服务器资源抖动 + 小概率状态漂移
    for (const s of this.servers) {
      if (s.status === "offline") continue
      s.cpu = clamp(Math.round(s.cpu + (Math.random() - 0.45) * 10), 3, 96)
      s.memory = clamp(Math.round(s.memory + (Math.random() - 0.5) * 6), 10, 97)
      s.disk = clamp(Number((s.disk + (Math.random() - 0.5) * 0.6).toFixed(1)), 5, 95)
      if (s.status === "online" && Math.random() < 0.01) s.status = "degraded"
      else if (s.status === "degraded" && Math.random() < 0.05) s.status = "online"
    }

    // 指标序列追加新点
    const push = (arr: number[], base: number, spread: number, min: number, max: number) => {
      const last = arr[arr.length - 1] ?? base
      arr.push(clamp(Math.round(last + (Math.random() - 0.45) * spread), min, max))
      if (arr.length > MAX_POINTS) arr.shift()
    }
    push(this.cpu, 40, 10, 5, 98)
    push(this.memory, 65, 6, 20, 97)
    push(this.networkIn, 300, 80, 40, 900)
    push(this.networkOut, 220, 60, 30, 700)
    this.labels.push(label)
    if (this.labels.length > MAX_POINTS) this.labels.shift()

    // Agent 心跳更新
    const nowIso = new Date().toISOString()
    for (const agent of this.agents.values()) {
      if (agent.state === "installed") agent.lastHeartbeat = nowIso
    }
    this.emit("agent:status", this.agentStatusList())

    // 实时日志流(概率追加)
    if (Math.random() < 0.45) {
      const entry = this.nextLogEntry()
      this.logs.push(entry)
      if (this.logs.length > 200) this.logs.shift()
      this.emit("logs:stream", entry)
    }

    // 推送(深拷贝,触发 React 重新渲染)
    this.emit("servers:update", this.servers.map((s) => ({ ...s })))
    this.emit("metrics:update", this.snapshot())
  }

  /* ---------- 日志生成 ---------- */

  private logSources = ["web", "api", "db", "nginx", "auth", "cron"]
  private logLevels: LogLevel[] = ["INFO", "INFO", "INFO", "WARN", "ERROR"]
  private logTemplates = [
    (m: string) => `200 GET /api/v1/${m} 42ms`,
    (m: string) => `201 POST /api/v1/${m}`,
    (m: string) => `slow query 1.2s on ${m} table`,
    (m: string) => `retrying upstream after 503 (${m})`,
    (m: string) => `connection pool warning: ${m}`,
    (m: string) => `health check passed (${m})`,
    (m: string) => `deploy completed: ${m}@v2.5.1`,
  ]

  private nextLogEntry(): LogEntry {
    this.logCounter += 1
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    const source = this.logSources[Math.floor(Math.random() * this.logSources.length)]
    const level = this.logLevels[Math.floor(Math.random() * this.logLevels.length)]
    const template = this.logTemplates[Math.floor(Math.random() * this.logTemplates.length)]
    return {
      id: `log-live-${this.logCounter}`,
      time,
      level,
      source,
      message: template(["servers", "deployments", "containers", "metrics", "users"][Math.floor(Math.random() * 5)]),
    }
  }

  /* ---------- Agent 状态 ---------- */

  private agentStatusList(): AgentStatus[] {
    return [...this.agents.entries()].map(([serverId, agent]) => ({
      serverId,
      state: agent.state,
      version: agent.version,
      lastHeartbeat: agent.lastHeartbeat,
      latencyMs: agent.state === "installed" ? Math.round(18 + Math.random() * 40) : null,
    }))
  }

  private getAgentStatus(serverId: string): AgentStatus {
    const agent = this.agents.get(serverId)
    if (!agent) {
      return { serverId, state: "uninstalled", version: null, lastHeartbeat: null, latencyMs: null }
    }
    return {
      serverId,
      state: agent.state,
      version: agent.version,
      lastHeartbeat: agent.lastHeartbeat,
      latencyMs: agent.state === "installed" ? Math.round(18 + Math.random() * 40) : null,
    }
  }

  private snapshot(): MetricsSnapshot {
    return {
      cpu: [...this.cpu],
      memory: [...this.memory],
      networkIn: [...this.networkIn],
      networkOut: [...this.networkOut],
      labels: [...this.labels],
      lastUpdated: Date.now(),
    }
  }

  /* ---------- Server API 实现(与真实 REST 同签名) ---------- */

  serverApi: ServerApi = {
    list: async (params?: ServerListParams): Promise<Paginated<Server>> => {
      await delay()
      const { search, status, region, page = 1, pageSize = 50 } = params ?? {}
      let items = this.servers
      const q = search?.trim().toLowerCase()
      if (q) {
        items = items.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.ip.includes(q) ||
            s.region.toLowerCase().includes(q)
        )
      }
      if (status) items = items.filter((s) => s.status === status)
      if (region) items = items.filter((s) => s.region === region)
      const start = (page - 1) * pageSize
      return {
        items: items.slice(start, start + pageSize).map((s) => ({ ...s })),
        total: items.length,
        page,
        pageSize,
      }
    },

    get: async (id: string): Promise<Server> => {
      await delay()
      const found = this.servers.find((s) => s.id === id)
      if (!found) throw new Error(`服务器不存在: ${id}`)
      return { ...found }
    },

    create: async (input: NewServerInput): Promise<Server> => {
      await delay()
      const server: Server = {
        id: `srv-${Date.now().toString(36)}`,
        name: input.name,
        hostname: input.hostname ?? input.name,
        ip: input.ip,
        port: input.port ?? 22,
        status: "offline",
        os: input.os,
        cpu: 0,
        memory: 0,
        disk: 0,
        region: input.region,
        createdAt: new Date().toISOString(),
        uptime: "—",
        cores: input.cores,
        ram: input.ram,
        storage: "0GB",
        ownerTeamId: "team-staging",
        environment: "staging",
      }
      this.servers = [server, ...this.servers]
      this.emit("servers:update", this.servers.map((s) => ({ ...s })))
      return { ...server }
    },

    update: async (id: string, patch: Partial<Server>): Promise<Server> => {
      await delay()
      const index = this.servers.findIndex((s) => s.id === id)
      if (index === -1) throw new Error(`服务器不存在: ${id}`)
      this.servers[index] = { ...this.servers[index], ...patch, id }
      this.emit("servers:update", this.servers.map((s) => ({ ...s })))
      return { ...this.servers[index] }
    },

    remove: async (id: string): Promise<void> => {
      await delay()
      this.servers = this.servers.filter((s) => s.id !== id)
      this.emit("servers:update", this.servers.map((s) => ({ ...s })))
    },

    /* ---------- Agent 接入 ---------- */

    createAgentToken: async (id: string): Promise<AgentToken> => {
      await delay()
      const server = this.servers.find((s) => s.id === id)
      if (!server) throw new Error(`服务器不存在: ${id}`)
      const token = `cp_agent_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      const agent = this.agents.get(id) ?? { state: "uninstalled" as const, version: null as string | null, lastHeartbeat: null as string | null, token: null as string | null }
      agent.state = "pending"
      agent.token = token
      this.agents.set(id, agent)
      this.emit("agent:status", this.agentStatusList())
      return {
        serverId: id,
        token,
        expiresAt,
        installCommand: `curl -fsSL https://install.cloudpanel.dev/agent.sh | AGENT_TOKEN=${token} bash`,
      }
    },

    registerAgent: async (token: string): Promise<AgentStatus> => {
      await delay()
      for (const [serverId, agent] of this.agents) {
        if (agent.token === token) {
          agent.state = "installed"
          agent.version = "1.4.2"
          agent.lastHeartbeat = new Date().toISOString()
          agent.token = null
          // 服务器上线
          const server = this.servers.find((s) => s.id === serverId)
          if (server) {
            server.status = "online"
            server.uptime = "刚刚"
          }
          this.emit("agent:status", this.agentStatusList())
          this.emit("servers:update", this.servers.map((s) => ({ ...s })))
          return this.getAgentStatus(serverId)
        }
      }
      throw new Error("无效的 Agent 令牌或令牌已过期")
    },

    getAgentStatus: async (id: string): Promise<AgentStatus> => {
      await delay(80)
      return this.getAgentStatus(id)
    },
  }

  /* ---------- Monitoring API 实现 ---------- */

  monitoringApi: MonitoringApi = {
    metrics: async (
      _serverId?: string,
      range: MetricsRange = "24h"
    ): Promise<MetricsSnapshot> => {
      await delay()
      const n = POINTS_BY_RANGE[range]
      const snap = this.snapshot()
      return {
        cpu: snap.cpu.slice(-n),
        memory: snap.memory.slice(-n),
        networkIn: snap.networkIn.slice(-n),
        networkOut: snap.networkOut.slice(-n),
        labels: snap.labels.slice(-n),
        lastUpdated: snap.lastUpdated,
      }
    },

    containers: async (_serverId?: string): Promise<Container[]> => {
      await delay()
      return this.containers.map((c) => ({ ...c }))
    },

    logs: async (_serverId?: string): Promise<LogEntry[]> => {
      await delay()
      return this.logs.map((l) => ({ ...l }))
    },
  }

  /* ---------- 其他数据源(事件/日志,静态) ---------- */

  getActivityEvents() {
    return activityEvents
  }
}

/** 单例:应用启动即开始模拟实时数据 */
export const mockServer = new MockServer()
mockServer.start()
