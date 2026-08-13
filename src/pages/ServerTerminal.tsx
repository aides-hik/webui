import { Link, useParams } from "react-router-dom"
import { ArrowLeft, RotateCcw, ShieldX } from "lucide-react"
import { toast } from "sonner"

import { AgentStatus } from "@/components/server/AgentStatus"
import { TerminalTabs } from "@/components/terminal/TerminalTabs"
import { PageContainer } from "@/components/common/PageContainer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useServers } from "@/hooks/useServers"
import { canExecuteTerminal } from "@/services/permissionService"
import { useAuthStore } from "@/stores/authStore"

/**
 * 服务器 Web 终端(页面级)
 * 架构:浏览器(xterm.js) → WebSocket → Terminal Gateway → SSH → Server
 * 权限:路由层 terminal.access + 页面层服务器范围校验(canExecuteTerminal)
 */
export function ServerTerminal() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.hasRole("admin"))
  const { servers, loading } = useServers()
  const server = servers.find((s) => s.id === id)

  /* 首次进入 store 为空:拉取期间展示骨架屏 */
  if (loading && !server) {
    return (
      <PageContainer size="wide" className="py-2">
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </PageContainer>
    )
  }

  if (!server) {
    return (
      <PageContainer className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="text-xl font-semibold">服务器不存在</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/servers">返回服务器列表</Link>
        </Button>
      </PageContainer>
    )
  }

  /* 服务器级终端权限:admin 或 资源范围覆盖 */
  const canTerminal = isAdmin || (user !== null && canExecuteTerminal(user, server))

  if (!canTerminal) {
    return (
      <PageContainer className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="h-8 w-8 text-destructive" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">无终端访问权限</h1>
          <p className="text-body-sm mt-2 max-w-sm">
            你的账号未获得 {server.name} 的终端权限(terminal.access)。
            请联系管理员在「服务器访问」中分配。
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/servers/${server.id}`}>返回详情页</Link>
        </Button>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
          <Link to={`/servers/${server.id}`}>
            <ArrowLeft />
            返回详情
          </Link>
        </Button>
        <div>
          <h2 className="text-title text-xl">Web 终端</h2>
          <p className="font-mono mt-0.5 text-xs text-muted-foreground">
            {server.name} · {server.ip} · 多会话
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success("重启命令已下发", {
                description: "经 Agent 通道执行(mock)",
              })
            }
          >
            <RotateCcw />
            重启服务器
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TerminalTabs serverId={server.id} serverName={server.name} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agent 状态</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentStatus serverId={server.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">连接说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>· 浏览器不直接连接 SSH</p>
              <p>· xterm.js 渲染 + WebSocket 双向通道</p>
              <p>· 支持多会话 Tab(最多 4 个)</p>
              <p>· 操作记录进入审计日志</p>
              <p className="text-caption pt-1">
                当前为 Mock 终端网关;接入真实后端仅需配置 VITE_WS_URL。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
