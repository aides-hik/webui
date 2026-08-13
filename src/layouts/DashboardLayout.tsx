import { Outlet } from "react-router-dom"

import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { Sidebar } from "@/components/layout/Sidebar"
import { useUIStore } from "@/stores/uiStore"

/**
 * 控制台布局 — Sidebar + Top Header + Main Content
 * 布局状态(折叠/抽屉)由 uiStore 统一管理
 */
export function DashboardLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={toggleSidebar}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 bg-muted/30 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
