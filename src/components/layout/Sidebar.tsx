import { NavLink } from "react-router-dom"
import {
  Activity,
  AppWindow,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Container,
  KeySquare,
  LayoutDashboard,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuthStore } from "@/stores/authStore"
import { PERMISSIONS, type PermissionId } from "@/types/auth"
import { cn } from "@/lib/utils"

const NAV_SECTIONS: {
  label: string
  items: { to: string; label: string; icon: React.ElementType; permission?: PermissionId }[]
}[] = [
  {
    label: "总览",
    items: [{ to: "/dashboard", label: "仪表盘", icon: LayoutDashboard }],
  },
  {
    label: "基础设施",
    items: [
      { to: "/servers", label: "服务器", icon: Server },
      { to: "/applications", label: "应用", icon: AppWindow },
      {
        to: "/containers",
        label: "容器",
        icon: Container,
        permission: PERMISSIONS.DOCKER_MANAGE,
      },
    ],
  },
  {
    label: "监控",
    items: [
      { to: "/metrics", label: "指标", icon: Activity },
      { to: "/logs", label: "日志", icon: ScrollText },
    ],
  },
  {
    label: "管理",
    items: [
      { to: "/users", label: "用户", icon: Users, permission: PERMISSIONS.USER_MANAGE },
      { to: "/teams", label: "团队", icon: Boxes, permission: PERMISSIONS.USER_MANAGE },
      { to: "/roles", label: "角色", icon: KeySquare, permission: PERMISSIONS.USER_MANAGE },
      {
        to: "/access",
        label: "服务器访问",
        icon: ShieldCheck,
        permission: PERMISSIONS.USER_MANAGE,
      },
      {
        to: "/settings",
        label: "设置",
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
    ],
  },
  {
    label: "安全",
    items: [{ to: "/audit", label: "审计日志", icon: ShieldCheck, permission: PERMISSIONS.AUDIT_VIEW }],
  },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
}

/**
 * 侧边导航 — 可折叠(桌面)/抽屉(移动端)
 * 状态由 uiStore 管理(折叠状态持久化)
 */
export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const username = user?.username ?? "guest"
  const roleLabels = user?.roles.map((r) => r.label).join(" / ") ?? "未登录"

  /** 权限过滤:无权限的菜单项与空分组隐藏 */
  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.permission === undefined || hasPermission(item.permission)
    ),
  })).filter((section) => section.items.length > 0)

  const content = (
    <>
      {/* 品牌区 */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="bg-gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-soft-sm">
          <Boxes className="h-[18px] w-[18px] text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">CloudPanel</p>
            <p className="text-caption truncate">服务器管理平台</p>
          </div>
        )}
      </div>

      <Separator />

      {/* 菜单 */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed && (
              <p className="text-label px-2 pb-1 text-muted-foreground/70">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const link = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                      collapsed && "justify-center px-0"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )
              return collapsed ? (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              )
            })}
          </div>
        ))}
      </nav>

      {/* 底部:用户 + 折叠 */}
      <div className="border-t p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-1.5",
            collapsed && "justify-center px-0"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">{username}</p>
              <p className="text-caption truncate">{roleLabels}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleCollapsed}
              aria-label="折叠侧边栏"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto mt-1 h-7 w-7"
            onClick={onToggleCollapsed}
            aria-label="展开侧边栏"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* 移动端抽屉 */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 移动端关闭按钮 */}
        <button
          className="absolute right-2 top-3.5 rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          onClick={onCloseMobile}
          aria-label="关闭菜单"
        >
          <X className="h-4 w-4" />
        </button>
        {content}
      </aside>

      {/* 桌面端侧栏(折叠控制) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-background transition-[width] duration-300 lg:flex",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {content}
      </aside>
    </>
  )
}
