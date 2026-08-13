/* ============================================================
   useMetrics — 监控指标 Hook(TanStack Query)
   - 初始数据:monitoringApi.metrics(REST,带缓存/重试/轮询)
   - 实时数据:订阅 metrics:update,写入 Query 缓存
   - 未来 REST + WebSocket 双通道的标准形态
   ============================================================ */

import { useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { monitoringApi } from "@/api/monitoring"
import { wsService } from "@/services/websocket"
import type { MetricsRange, MetricsSnapshot } from "@/types/metrics"

export function useMetrics(range: MetricsRange = "24h") {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ["metrics", range] as const, [range])

  const query = useQuery({
    queryKey,
    queryFn: () => monitoringApi.metrics(undefined, range),
    // 兜底轮询(WebSocket 断连时数据仍保持新鲜)
    refetchInterval: 60_000,
    staleTime: 15_000,
  })

  // 实时通道:推送直接覆盖缓存
  useEffect(() => {
    return wsService.subscribe<MetricsSnapshot>("metrics:update", (snapshot) => {
      queryClient.setQueryData(queryKey, snapshot)
    })
  }, [queryClient, queryKey])

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
