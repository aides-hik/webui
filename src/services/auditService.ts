/* ============================================================
   审计查询服务
   ------------------------------------------------------------
   提供分页 / 过滤查询接口。
   未来直接映射后端:GET /api/audit?page=1&pageSize=20&status=failed…
   当前实现基于 mockAudit 内存数据,签名与真实 API 对齐。
   ============================================================ */

import { auditLogs } from "@/services/mockAudit"
import { ACTION_LABELS, type AuditLog, type AuditStatus } from "@/types/audit"

export interface AuditQuery {
  page: number
  pageSize: number
  /** 非 admin 传入本人用户名,服务端做数据范围限制 */
  scopeUsername?: string
  username?: string
  action?: string
  status?: AuditStatus | "all"
  serverId?: string
  /** ISO 时间 */
  startTime?: string
  endTime?: string
  /** 时间范围快捷选项 */
  timeRange?: "all" | "24h" | "7d" | "30d"
}

export interface AuditResponse {
  items: AuditLog[]
  total: number
  page: number
  pageSize: number
}

const delay = (ms = 150 + Math.random() * 200) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** 按查询条件过滤(不含分页) */
function filterLogs(query: AuditQuery): AuditLog[] {
  const { scopeUsername, username, action, status, serverId, startTime, endTime, timeRange } = query

  let list = auditLogs

  // RBAC 数据范围
  if (scopeUsername) {
    list = list.filter((l) => l.username === scopeUsername)
  }
  if (username && username !== "ALL") {
    list = list.filter((l) => l.username === username)
  }
  if (action && action !== "ALL") {
    list = list.filter((l) => l.action === action)
  }
  if (status && status !== "all") {
    list = list.filter((l) => l.status === status)
  }
  if (serverId && serverId !== "ALL") {
    list = list.filter((l) => l.serverId === serverId)
  }

  const now = Date.now()
  const rangeMs =
    timeRange === "24h"
      ? 24 * 3600_000
      : timeRange === "7d"
        ? 7 * 86_400_000
        : timeRange === "30d"
          ? 30 * 86_400_000
          : Infinity

  if (rangeMs !== Infinity) {
    list = list.filter((l) => now - new Date(l.createdAt).getTime() <= rangeMs)
  }
  if (startTime) {
    list = list.filter((l) => l.createdAt >= startTime)
  }
  if (endTime) {
    list = list.filter((l) => l.createdAt <= endTime)
  }

  return list
}

/** 分页查询审计日志 */
export async function getAuditLogs(query: AuditQuery): Promise<AuditResponse> {
  await delay()
  const filtered = filterLogs(query)
  const { page, pageSize } = query
  const start = (page - 1) * pageSize
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  }
}

/** 全量过滤(统计卡 / 导出用,未来映射 GET /api/audit/export) */
export async function getAuditLogsAll(query: Omit<AuditQuery, "page" | "pageSize">): Promise<AuditLog[]> {
  await delay(80)
  return filterLogs({ ...query, page: 1, pageSize: Number.MAX_SAFE_INTEGER })
}

/** 筛选条件选项(用户 / 操作 / 服务器) */
export function getAuditOptions(scopeUsername?: string) {
  let list = auditLogs
  if (scopeUsername) list = list.filter((l) => l.username === scopeUsername)

  return {
    users: Array.from(new Set(list.map((l) => l.username))),
    actions: Array.from(new Set(list.map((l) => l.action))).map((action) => ({
      value: action,
      label: ACTION_LABELS[action as keyof typeof ACTION_LABELS] ?? action,
    })),
    servers: Array.from(
      new Set(list.map((l) => l.serverId).filter((s): s is string => Boolean(s)))
    ),
  }
}

export type { AuditStatus }
