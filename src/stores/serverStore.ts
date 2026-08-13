/* ============================================================
   服务器状态 Store(Zustand)
   - 服务器列表 / 加载状态 / 选中项
   - CRUD 统一走 serverApi(底层自动 Mock/Real 切换)
   - 实时同步:订阅 servers:update,服务端推送直接更新
   ============================================================ */

import { create } from "zustand"

import { serverApi } from "@/api/server"
import { wsService } from "@/services/websocket"
import type { NewServerInput, Server } from "@/types/server"

interface ServerState {
  servers: Server[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
  selectedServerId: string | null

  fetchServers: () => Promise<void>
  addServer: (input: NewServerInput) => Promise<Server>
  updateServer: (id: string, patch: Partial<Server>) => Promise<void>
  removeServer: (id: string) => Promise<void>
  selectServer: (id: string | null) => void
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  loading: false,
  error: null,
  lastUpdated: null,
  selectedServerId: null,

  fetchServers: async () => {
    set({ loading: true, error: null })
    try {
      const res = await serverApi.list()
      set({ servers: res.items, loading: false, lastUpdated: Date.now() })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "加载服务器列表失败",
      })
    }
  },

  addServer: async (input) => {
    try {
      const created = await serverApi.create(input)
      set((s) => ({ servers: [created, ...s.servers] }))
      return created
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "添加失败" })
      throw err
    }
  },

  updateServer: async (id, patch) => {
    try {
      const updated = await serverApi.update(id, patch)
      set((s) => ({
        servers: s.servers.map((x) => (x.id === id ? updated : x)),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "更新失败" })
      throw err
    }
  },

  removeServer: async (id) => {
    try {
      await serverApi.remove(id)
      set((s) => ({
        servers: s.servers.filter((x) => x.id !== id),
        selectedServerId: s.selectedServerId === id ? null : s.selectedServerId,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "删除失败" })
      throw err
    }
  },

  selectServer: (id) => set({ selectedServerId: id }),
}))

/* ---------- 实时同步:WebSocket 推送 → Store ---------- */

wsService.subscribe<Server[]>("servers:update", (servers) => {
  useServerStore.setState({ servers, lastUpdated: Date.now() })
})
