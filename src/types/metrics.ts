/* ============================================================
   监控指标数据模型
   ============================================================ */

/** 时间范围查询参数 */
export type MetricsRange = "1h" | "6h" | "24h"

/** 单点指标 */
export interface MetricsPoint {
  timestamp: number // epoch ms
  value: number
}

/** 单序列指标(带元信息) */
export interface MetricsSeries {
  serverId?: string
  metric: "cpu" | "memory" | "disk" | "network"
  points: MetricsPoint[]
}

/** 实时指标快照(图表消费格式,数组等长) */
export interface MetricsSnapshot {
  cpu: number[]
  memory: number[]
  networkIn: number[]
  networkOut: number[]
  labels: string[]
  lastUpdated: number
}

/** 存储类指标(Swap / 磁盘 IO / 磁盘占用) */
export interface StorageMetrics {
  swap: number[]
  diskRead: number[]
  diskWrite: number[]
  /** 当前磁盘占用率(%) */
  diskUsage: number
  /** 磁盘占用率历史(迷你图) */
  diskHistory: number[]
  labels: string[]
}
