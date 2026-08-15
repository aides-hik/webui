import { toast } from "sonner"
import { Cpu, HardDrive, MemoryStick, RotateCcw, SquareTerminal } from "lucide-react"

import { serverApi } from "@/api/server"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { useAuthStore } from "@/stores/authStore"
import { useMetrics } from "@/hooks/useMetrics"
import { PERMISSIONS } from "@/types/auth"
import { ResourceChart } from "@/components/metrics/ResourceChart"
import { ContainerList } from "@/components/server/ContainerList"
import { LogsViewer } from "@/components/server/LogsViewer"
import { ResourceBar, ServerStatusBadge } from "@/components/server/ServerStatus"
import { TerminalTabs } from "@/components/terminal/TerminalTabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Server } from "@/types/server"

/* ================= Overview ================= */

function OverviewTab({ server }: { server: Server }) {
  const currentUser = useAuthStore((s) => s.user)
  const infoItems = [
    { label: "区域", value: server.region },
    { label: "系统", value: server.os },
    { label: "运行时长", value: server.uptime },
    { label: "CPU 核心", value: String(server.cores) },
    { label: "内存", value: server.ram },
    { label: "存储", value: server.storage },
  ]

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <ServerStatusBadge status={server.status} />
        <span className="font-mono text-xs text-muted-foreground">{server.ip}</span>
        <div className="ml-auto flex gap-2">
          <PermissionGuard
            permission={PERMISSIONS.SERVER_MANAGE}
            resourceId={server.id}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void serverApi.restart(
                  server.id,
                  currentUser
                    ? { userId: currentUser.id, username: currentUser.username }
                    : undefined
                )
                toast.success("重启命令已下发", {
                  description: `${server.name} 将在 60s 内重启(mock)`,
                })
              }}
            >
              <RotateCcw />
              重启
            </Button>
          </PermissionGuard>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={`#/servers/${server.id}/terminal`}>
              <SquareTerminal />
              打开终端
            </a>
          </Button>
        </div>
      </div>

      {/* 资源总览 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">资源使用</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "CPU", value: server.cpu, icon: Cpu },
              { label: "内存", value: server.memory, icon: MemoryStick },
              { label: "磁盘", value: server.disk, icon: HardDrive },
            ].map((r) => (
              <div key={r.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <r.icon className="h-3.5 w-3.5" />
                    {r.label}
                  </span>
                  <span className="font-mono">{r.value}%</span>
                </div>
                <ResourceBar value={r.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">主机信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3">
            {infoItems.map((item) => (
              <div key={item.label}>
                <p className="text-caption text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ================= Metrics ================= */

function MetricsTab() {
  const { data: metrics } = useMetrics("24h")
  const labels = metrics?.labels ?? []
  return (
    <div className="space-y-4">
      <ResourceChart
        title="CPU 使用率"
        unit="%"
        labels={labels}
        series={[{ name: "CPU", color: "text-primary", data: metrics?.cpu ?? [] }]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ResourceChart
          title="内存使用率"
          unit="%"
          labels={labels}
          series={[{ name: "内存", color: "text-primary", data: metrics?.memory ?? [] }]}
        />
        <ResourceChart
          title="网络流量"
          unit=" MB/s"
          labels={labels}
          series={[
            { name: "入站", color: "text-primary", data: metrics?.networkIn ?? [] },
            { name: "出站", color: "text-success", data: metrics?.networkOut ?? [] },
          ]}
        />
      </div>
    </div>
  )
}

/* ================= 组装 ================= */

interface ServerDetailTabsProps {
  server: Server
  defaultTab?: string
}

/**
 * 服务器详情 Tabs — 概览 / 终端 / Docker / 日志 / 指标
 * 终端、Docker、日志均为共享组件(与平台级页面复用)
 */
export function ServerDetailTabs({ server, defaultTab = "overview" }: ServerDetailTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} key={defaultTab}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {[
          { value: "overview", label: "概览" },
          { value: "terminal", label: "终端" },
          { value: "docker", label: "Docker" },
          { value: "logs", label: "日志" },
          { value: "metrics", label: "指标" },
        ].map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <OverviewTab server={server} />
      </TabsContent>
      <TabsContent value="terminal" className="mt-4">
        <PermissionGuard
          permission={PERMISSIONS.TERMINAL_ACCESS}
          resourceId={server.id}
          fallback={
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              当前账号无此服务器的终端访问权限(terminal.access)。
              请联系管理员在「服务器访问」中分配。
            </div>
          }
        >
          <TerminalTabs serverId={server.id} serverName={server.name} />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="docker" className="mt-4">
        <PermissionGuard
          permission={PERMISSIONS.DOCKER_MANAGE}
          resourceId={server.id}
          fallback={
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              当前账号无此服务器的容器管理权限(docker.manage)。
            </div>
          }
        >
          <ContainerList serverId={server.id} />
        </PermissionGuard>
      </TabsContent>
      <TabsContent value="logs" className="mt-4">
        <LogsViewer serverId={server.id} height={360} />
      </TabsContent>
      <TabsContent value="metrics" className="mt-4">
        <MetricsTab />
      </TabsContent>
    </Tabs>
  )
}
