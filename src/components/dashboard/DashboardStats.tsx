import { useMemo } from "react"
import { Activity, Cpu, HardDrive, MemoryStick, Server } from "lucide-react"

import { AnimatedContainer } from "@/components/common/AnimatedContainer"
import { Sparkline } from "@/components/metrics/ResourceChart"
import { Card, CardContent } from "@/components/ui/card"
import { useServers } from "@/hooks/useServers"
import { filterAccessibleServers } from "@/services/permissionService"
import { useAuthStore } from "@/stores/authStore"
import {
  cpuHistory,
  memoryHistory,
  networkInHistory,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface StatCardData {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  icon: React.ElementType
  spark: number[]
  sparkColor: string
  footnote: string
}

function buildStats(serverCount: number, onlineCount: number, avgCpu: number, avgMem: number, avgDisk: number, netIn: number): StatCardData[] {
  return [
    {
      label: "在线服务器",
      value: `${onlineCount} / ${serverCount}`,
      delta: "+1",
      deltaUp: true,
      icon: Server,
      spark: [3, 4, 4, 5, 6, 6, 7, 7],
      sparkColor: "text-primary",
      footnote: "1 台处于维护中",
    },
    {
      label: "CPU 使用率",
      value: `${avgCpu}%`,
      delta: "-4.2%",
      deltaUp: false,
      icon: Cpu,
      spark: cpuHistory.slice(-12),
      sparkColor: "text-primary",
      footnote: "集群平均负载",
    },
    {
      label: "内存使用率",
      value: `${avgMem}%`,
      delta: "+1.8%",
      deltaUp: true,
      icon: MemoryStick,
      spark: memoryHistory.slice(-12),
      sparkColor: "text-primary",
      footnote: "集群平均占用",
    },
    {
      label: "磁盘存储",
      value: `${avgDisk}%`,
      delta: "+0.6%",
      deltaUp: true,
      icon: HardDrive,
      spark: [54, 55, 55, 56, 56, 57, 58, 58],
      sparkColor: "text-primary",
      footnote: "9.6 TB 总容量",
    },
    {
      label: "网络流量",
      value: `${netIn} MB/s`,
      delta: "+12.4%",
      deltaUp: true,
      icon: Activity,
      spark: networkInHistory.slice(-12),
      sparkColor: "text-primary",
      footnote: "入站 · 实时",
    },
  ]
}

/**
 * Dashboard 概览统计卡(5 张)
 * 数据来自 useServers(Zustand store,WebSocket 实时更新)
 */
export function DashboardStats() {
  const { servers: allServers, loading } = useServers()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.hasRole("admin"))

  /* Resource Scope:统计仅基于用户可访问的服务器 */
  const servers = useMemo(() => {
    if (!user || isAdmin) return allServers
    return filterAccessibleServers(user, allServers)
  }, [allServers, user, isAdmin])

  const online = servers.filter((s) => s.status === "online").length
  const active = servers.filter((s) => s.status !== "offline")
  const avgCpu = active.length
    ? Math.round(active.reduce((a, s) => a + s.cpu, 0) / active.length)
    : 0
  const avgMem = active.length
    ? Math.round(active.reduce((a, s) => a + s.memory, 0) / active.length)
    : 0
  const avgDisk = servers.length
    ? Math.round(servers.reduce((a, s) => a + s.disk, 0) / servers.length)
    : 0
  const netIn = networkInHistory[networkInHistory.length - 1]

  const stats = buildStats(servers.length, online, avgCpu, avgMem, avgDisk, netIn)

  if (loading && servers.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
              <div className="h-6 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat, i) => (
        <AnimatedContainer
          key={stat.label}
          animation="fade-up"
          delay={i * 60}
          className="min-w-0"
        >
          <Card className="h-full shadow-soft-sm transition-shadow hover:shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </span>
                {stat.delta && (
                  <span
                    className={cn(
                      "text-caption font-medium",
                      stat.deltaUp ? "text-success" : "text-muted-foreground"
                    )}
                  >
                    {stat.deltaUp ? "↑" : "↓"} {stat.delta}
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="text-caption mt-0.5">{stat.label}</p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <Sparkline data={stat.spark} colorClass={stat.sparkColor} />
                <p className="text-caption shrink-0 text-right leading-tight">
                  {stat.footnote}
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      ))}
    </div>
  )
}
