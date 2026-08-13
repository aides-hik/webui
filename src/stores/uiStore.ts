/* ============================================================
   UI 状态 Store(Zustand)
   - 侧边栏折叠/抽屉(持久化到 localStorage)
   - 全局 UI 偏好(后续可扩展:命令面板、通知等)
   ============================================================ */

import { create } from "zustand"

const SIDEBAR_KEY = "webui-sidebar-collapsed"

interface UIState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  notifications: number

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed:
    typeof localStorage !== "undefined" &&
    localStorage.getItem(SIDEBAR_KEY) === "true",
  mobileSidebarOpen: false,
  notifications: 3,

  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return { sidebarCollapsed: next }
    }),

  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed))
    set({ sidebarCollapsed: collapsed })
  },

  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  clearNotifications: () => set({ notifications: 0 }),
}))
