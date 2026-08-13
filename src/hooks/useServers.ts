/* ============================================================
   useServers — 服务器列表 Hook
   - 首次挂载自动拉取(store 已有数据则跳过)
   - 实时更新由 serverStore 的 WebSocket 订阅驱动
   - 返回服务器列表 / 加载态 / 错误 / 手动刷新
   ============================================================ */

import { useEffect } from "react"

import { useServerStore } from "@/stores/serverStore"

export function useServers() {
  const servers = useServerStore((s) => s.servers)
  const loading = useServerStore((s) => s.loading)
  const error = useServerStore((s) => s.error)
  const lastUpdated = useServerStore((s) => s.lastUpdated)
  const fetchServers = useServerStore((s) => s.fetchServers)

  useEffect(() => {
    const { servers, loading } = useServerStore.getState()
    if (servers.length === 0 && !loading) {
      void fetchServers()
    }
  }, [fetchServers])

  return {
    servers,
    loading,
    error,
    lastUpdated,
    refresh: fetchServers,
  }
}
