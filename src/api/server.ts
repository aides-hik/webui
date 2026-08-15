/* ============================================================
   服务器 API
   ------------------------------------------------------------
   统一出口:未配置 VITE_API_BASE_URL 时自动走 Mock 实现
   (services/mockServer.ts),配置后自动切换真实 REST 请求。
   调用方(store/hooks)无需关心数据来源。
   ============================================================ */

import { api } from "@/api/client"
import { mockServer } from "@/services/mockServer"
import type { AgentStatus, AgentToken } from "@/types/agent"
import type { AuditActor } from "@/types/audit"
import type {
  NewServerInput,
  Paginated,
  Server,
  ServerListParams,
} from "@/types/server"

export interface ServerApi {
  list(params?: ServerListParams): Promise<Paginated<Server>>
  get(id: string): Promise<Server>
  create(input: NewServerInput, actor?: AuditActor): Promise<Server>
  update(id: string, patch: Partial<Server>, actor?: AuditActor): Promise<Server>
  remove(id: string, actor?: AuditActor): Promise<void>
  /** 重启服务器(审计在服务端/mock 实现内完成) */
  restart(id: string, actor?: AuditActor): Promise<Server>
  /** 生成 Agent 安装令牌(30 分钟有效) */
  createAgentToken(id: string): Promise<AgentToken>
  /** 查询 Agent 接入状态 */
  getAgentStatus(id: string): Promise<AgentStatus>
  /** 模拟 Agent 使用令牌注册(真实场景由 Agent 进程调用) */
  registerAgent(token: string): Promise<AgentStatus>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

/** 真实 REST 实现:GET/POST /api/servers …(actor 由服务端从 Token 解析,忽略) */
const realServerApi: ServerApi = {
  list: (params) => api.get<Paginated<Server>>("/servers", params),
  get: (id) => api.get<Server>(`/servers/${id}`),
  create: (input) => api.post<Server>("/servers", input),
  update: (id, patch) => api.put<Server>(`/servers/${id}`, patch),
  remove: (id) => api.delete<void>(`/servers/${id}`),
  restart: (id) => api.post<Server>(`/servers/${id}/restart`),
  createAgentToken: (id) => api.post<AgentToken>(`/servers/${id}/agent-token`),
  getAgentStatus: (id) => api.get<AgentStatus>(`/servers/${id}/agent`),
  registerAgent: (token) => api.post<AgentStatus>("/agent/register", { token }),
}

export const serverApi: ServerApi = USE_MOCK ? mockServer.serverApi : realServerApi
