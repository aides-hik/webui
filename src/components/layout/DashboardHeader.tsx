import { useLocation, useNavigate } from "react-router-dom"
import { Bell, LogOut, Menu, Moon, Search, Sun, User as UserIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/common/theme-provider"
import { useAuthStore } from "@/stores/authStore"

const TITLES: Record<string, string> = {
  "/dashboard": "仪表盘",
  "/servers": "服务器",
  "/applications": "应用",
  "/containers": "容器",
  "/metrics": "指标",
  "/logs": "日志",
  "/users": "用户",
  "/settings": "设置",
}

interface DashboardHeaderProps {
  onOpenMobileSidebar: () => void
}

/**
 * 顶栏 — 移动端菜单按钮 / 页面标题 / 全局搜索 / 主题切换 / 通知 / 当前用户
 */
export function DashboardHeader({ onOpenMobileSidebar }: DashboardHeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const title = TITLES[pathname] ?? "CloudPanel"
  const username = user?.username ?? "guest"
  const roleLabels = user?.roles.map((r) => r.label).join(" / ") ?? ""

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="打开菜单"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 items-center gap-2">
        <span className="text-caption hidden text-muted-foreground sm:inline">
          CloudPanel
        </span>
        <span className="text-caption hidden text-muted-foreground/50 sm:inline">
          /
        </span>
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索服务器、容器…"
            className="h-8 w-56 rounded-md pl-8 text-xs shadow-none lg:w-72"
          />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="切换主题"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>切换 {isDark ? "亮色" : "暗色"}主题</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="通知" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>3 条未读通知</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2" aria-label="用户菜单">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{username}</p>
              <p className="text-caption font-normal">{roleLabels}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
