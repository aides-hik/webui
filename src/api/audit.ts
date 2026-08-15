/* ============================================================
   审计 API(查询)
   - getLogs:分页查询(含 RBAC 数据范围)
   - getAll:全量过滤(统计卡 / 导出)
   - getOptions:筛选项(用户 / 操作 / 服务器)
   Mock 实现委托 services/auditService(查询逻辑与真实 API 签名对齐)。
   ============================================================ */

import { api } from "@/api/client"
import {
  getAuditLogs,
  getAuditLogsAll,
  getAuditOptions,
  type AuditQuery,
  type AuditResponse,
} from "@/services/auditService"
import { recordAudit } from "@/services/mockAudit"
import type { AuditInput, AuditLog } from "@/types/audit"

export interface AuditOptions {
  users: string[]
  actions: { value: string; label: string }[]
  servers: string[]
}

export interface AuditApi {
  getLogs(query: AuditQuery): Promise<AuditResponse>
  getAll(query: Omit<AuditQuery, "page" | "pageSize">): Promise<AuditLog[]>
  getOptions(scopeUsername?: string): Promise<AuditOptions>
  /**
   * 记录审计(客户端事件,如登出)。
   * Mock:直接写入内存;真实模式:fire-and-forget 上报,由服务端落库。
   */
  record(input: AuditInput): void
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

const mockAuditApi: AuditApi = {
  getLogs: (query) => getAuditLogs(query),
  getAll: (query) => getAuditLogsAll(query),
  getOptions: async (scopeUsername) => getAuditOptions(scopeUsername),
  record: (input) => {
    recordAudit(input)
  },
}

const realAuditApi: AuditApi = {
  getLogs: (query) => api.get<AuditResponse>("/audit", query as object),
  getAll: (query) => api.get<AuditLog[]>("/audit/export", query as object),
  getOptions: (scopeUsername) =>
    api.get<AuditOptions>("/audit/options", { scopeUsername }),
  record: (input) => {
    void api.post("/audit", input).catch(() => undefined)
  },
}

export const auditApi: AuditApi = USE_MOCK ? mockAuditApi : realAuditApi
