/* ============================================================
   服务器域数据模型
   ============================================================ */

export type ServerStatus = "online" | "offline" | "maintenance" | "degraded"

export interface Server {
  id: string
  name: string
  hostname: string
  ip: string
  port: number
  status: ServerStatus
  os: string
  cpu: number
  memory: number
  disk: number
  region: string
  createdAt: string
  uptime: string
  cores: number
  ram: string
  storage: string
  /** 资源归属团队(Resource Scope 隔离) */
  ownerTeamId: string
  /** 部署环境 */
  environment: "production" | "staging" | "development"
}

/** 新增服务器输入(创建时服务端补充 id/status/createdAt 等) */
export interface NewServerInput {
  name: string
  hostname?: string
  ip: string
  port?: number
  os: string
  region: string
  cores: number
  ram: string
}

export interface ServerListParams {
  search?: string
  status?: ServerStatus
  region?: string
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/* ---------- 活动事件 / 日志(运维域) ---------- */

export type ActivityType = "reboot" | "deploy" | "login" | "config" | "warning"

export interface ActivityEvent {
  id: string
  type: ActivityType
  title: string
  description: string
  time: string
  server?: string
}

export type LogLevel = "INFO" | "WARN" | "ERROR"

export interface LogEntry {
  id: string
  time: string
  level: LogLevel
  source: string
  message: string
}
