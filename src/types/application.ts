/* ============================================================
   应用域数据模型(部署在服务器上的应用)
   ============================================================ */

export type ApplicationStatus = "running" | "stopped" | "failed"

export interface Application {
  id: string
  name: string
  serverId: string
  serverName: string
  status: ApplicationStatus
  version: string
  port: number
  updatedAt: string // ISO 或相对时间
}

export type ApplicationAction = "start" | "stop" | "restart"
