/* ============================================================
   监控 / Docker API
   - metrics:CPU/内存/网络时序
   - containers:Docker 容器列表
   - containerAction:容器启停/重启
   - getStorageMetrics:存储类指标(Swap / 磁盘 IO / 磁盘占用)
   - getActivityEvents:平台活动事件
   - logs:平台级 / 单机日志
   Mock 模式自动转发 services/mockServer.ts
   ============================================================ */

import { api } from "@/api/client"
import { mockServer } from "@/services/mockServer"
import type { AuditActor } from "@/types/audit"
import type { Container, ContainerAction } from "@/types/docker"
import type { MetricsRange, MetricsSnapshot, StorageMetrics } from "@/types/metrics"
import type { ActivityEvent, LogEntry } from "@/types/server"

export interface MonitoringApi {
  metrics(serverId?: string, range?: MetricsRange): Promise<MetricsSnapshot>
  containers(serverId?: string): Promise<Container[]>
  /** 容器操作(启停/重启),审计由 mock 实现/服务端完成 */
  containerAction(
    containerId: string,
    action: ContainerAction,
    actor?: AuditActor,
    serverId?: string
  ): Promise<Container>
  /** 存储类指标(Swap / 磁盘 IO / 磁盘占用) */
  getStorageMetrics(): Promise<StorageMetrics>
  /** 平台活动事件(Dashboard 最近事件) */
  getActivityEvents(): Promise<ActivityEvent[]>
  /** 平台级 / 单机日志(未来经 Agent 流式获取) */
  logs(serverId?: string): Promise<LogEntry[]>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

const realMonitoringApi: MonitoringApi = {
  metrics: (serverId, range) =>
    api.get<MetricsSnapshot>("/metrics", { serverId, range }),
  containers: (serverId) =>
    api.get<Container[]>("/docker/containers", { serverId }),
  containerAction: (containerId, action) =>
    api.post<Container>(`/docker/containers/${containerId}/action`, { action }),
  getStorageMetrics: () => api.get<StorageMetrics>("/metrics/storage"),
  getActivityEvents: () => api.get<ActivityEvent[]>("/metrics/activity"),
  logs: (serverId) => api.get<LogEntry[]>("/logs", { serverId }),
}

export const monitoringApi: MonitoringApi = USE_MOCK
  ? mockServer.monitoringApi
  : realMonitoringApi
