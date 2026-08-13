import { NavLink, Outlet } from "react-router-dom"
import { LayoutDashboard, Moon, Palette, Server, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/common/theme-provider"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: LayoutDashboard },
  { to: "/design-system", label: "设计系统", icon: Palette },
  { to: "/dashboard", label: "控制台", icon: Server },
]

/**
 * 全局应用布局:顶部导航栏 + 内容出口
 * 所有页面均嵌套在此布局内
 */
export function AppLayout() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <LayoutDashboard className="h-4 w-4" />
              </span>
              WebUI Platform
            </NavLink>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="切换主题"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>切换 {isDark ? "亮色" : "暗色"}主题</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <Separator />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          WebUI Platform · shadcn/ui · React 18
        </div>
      </footer>
    </div>
  )
}
