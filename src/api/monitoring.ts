/* ============================================================
   监控 / Docker API
   - metrics: CPU/内存/网络时序
   - containers: Docker 容器列表与操作
   Mock 模式自动转发 services/mockServer.ts
   ============================================================ */

import { api } from "@/api/client"
import { mockServer } from "@/services/mockServer"
import type { Container } from "@/types/docker"
import type { MetricsRange, MetricsSnapshot } from "@/types/metrics"
import type { LogEntry } from "@/types/server"

export interface MonitoringApi {
  metrics(serverId?: string, range?: MetricsRange): Promise<MetricsSnapshot>
  containers(serverId?: string): Promise<Container[]>
  /** 平台级 / 单机日志(未来经 Agent 流式获取) */
  logs(serverId?: string): Promise<LogEntry[]>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

const realMonitoringApi: MonitoringApi = {
  metrics: (serverId, range) =>
    api.get<MetricsSnapshot>("/metrics", { serverId, range }),
  containers: (serverId) =>
    api.get<Container[]>("/docker/containers", { serverId }),
  logs: (serverId) => api.get<LogEntry[]>("/logs", { serverId }),
}

export const monitoringApi: MonitoringApi = USE_MOCK
  ? mockServer.monitoringApi
  : realMonitoringApi
