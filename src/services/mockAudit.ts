/* ============================================================
   Mock 审计服务
   ------------------------------------------------------------
   生成并记录平台审计日志。
   真实场景:服务端审计存储(文件/时序库/数据库),前端仅查询;
   当前由内存模拟,recordAudit 签名与未来 API 对齐。
   ============================================================ */

import { mockUsers } from "@/services/mockAuth"
import type { AuditAction, AuditInput, AuditLog } from "@/types/audit"

/* ---------- 种子数据生成 ---------- */

const USERS = ["admin", "zhangwei", "lina", "chenyu", "deploy-bot"]
const SERVERS = [
  { id: "srv-prod-web-01", name: "prod-web-01" },
  { id: "srv-prod-api-01", name: "prod-api-01" },
  { id: "srv-prod-db-01", name: "prod-db-01" },
  { id: "srv-cache-01", name: "cache-01" },
  { id: "srv-staging-web-01", name: "staging-web-01" },
]
const CONTAINERS = ["web", "api", "db", "redis", "worker", "batch-job"]
const IP_POOL = ["203.0.113.7", "10.0.0.12", "10.0.0.15", "203.0.113.42", "192.168.1.100"]
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

interface SeedTemplate {
  action: AuditAction
  resourceType: string
  serverId?: string
  failed?: boolean
  metadata?: Record<string, unknown>
}

/** 模板权重循环生成 40 条,时间从 7 天前到当前递减 */
const SEED_TEMPLATES: SeedTemplate[] = [
  { action: "auth.login", resourceType: "console" },
  { action: "auth.logout", resourceType: "console" },
  { action: "auth.login_failed", resourceType: "console", failed: true, metadata: { reason: "密码错误" } },
  { action: "server.create", resourceType: "server", metadata: { name: "prod-web-02", ip: "172.16.1.12" } },
  { action: "server.update", resourceType: "server", metadata: { field: "region" } },
  { action: "server.restart", resourceType: "server" },
  { action: "server.delete", resourceType: "server", failed: true, metadata: { reason: "服务器在线,禁止删除" } },
  { action: "container.start", resourceType: "container", metadata: { image: "nginx:1.25-alpine" } },
  { action: "container.stop", resourceType: "container" },
  { action: "container.restart", resourceType: "container" },
  { action: "terminal.open", resourceType: "terminal" },
  { action: "terminal.command", resourceType: "terminal", metadata: { command: "docker ps" } },
  { action: "terminal.command", resourceType: "terminal", metadata: { command: "df -h" } },
  { action: "user.role_change", resourceType: "user", metadata: { from: "viewer", to: "operator" } },
  { action: "user.disable", resourceType: "user", metadata: { reason: "离职" } },
  { action: "settings.update", resourceType: "settings", metadata: { section: "security" } },
]

function buildSeed(): AuditLog[] {
  const logs: AuditLog[] = []
  const now = Date.now()
  const total = 40
  const spanMs = 7 * 24 * 3600 * 1000

  for (let i = 0; i < total; i += 1) {
    const tpl = SEED_TEMPLATES[i % SEED_TEMPLATES.length]
    const username = USERS[Math.floor(Math.random() * USERS.length)]
    const user = mockUsers.find((u) => u.username === username)
    const server = tpl.resourceType === "container"
      ? SERVERS[Math.floor(Math.random() * SERVERS.length)]
      : tpl.serverId
        ? SERVERS.find((s) => s.id === tpl.serverId) ?? SERVERS[0]
        : Math.random() < 0.5
          ? SERVERS[Math.floor(Math.random() * SERVERS.length)]
          : undefined
    const resourceId =
      tpl.resourceType === "container"
        ? CONTAINERS[Math.floor(Math.random() * CONTAINERS.length)]
        : tpl.resourceType === "user"
          ? `usr-0${1 + Math.floor(Math.random() * 5)}`
          : server?.id ?? `res-${i}`

    logs.push({
      id: `audit-${String(total - i).padStart(4, "0")}`,
      userId: user?.id ?? "usr-00",
      username,
      action: tpl.action,
      resourceType: tpl.resourceType,
      resourceId,
      serverId: server?.id,
      status: tpl.failed ? "failed" : Math.random() < 0.08 ? "failed" : "success",
      ip: IP_POOL[Math.floor(Math.random() * IP_POOL.length)],
      userAgent: UA,
      createdAt: new Date(now - (i / total) * spanMs - Math.random() * 3600_000).toISOString(),
      metadata: tpl.metadata,
    })
  }

  // 按时间倒序(最新在前)
  return logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const auditLogs: AuditLog[] = buildSeed()

/* ---------- 记录新事件 ---------- */

let seq = 0

export function recordAudit(input: AuditInput): AuditLog {
  seq += 1
  const log: AuditLog = {
    id: `audit-live-${Date.now().toString(36)}-${seq}`,
    userId: input.userId,
    username: input.username,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? "-",
    serverId: input.serverId,
    status: input.status ?? "success",
    ip: "192.168.1.100",
    userAgent: UA,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  }
  auditLogs.unshift(log)
  if (auditLogs.length > 500) auditLogs.pop()
  return log
}
