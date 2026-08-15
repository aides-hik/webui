import { useQuery } from "@tanstack/react-query"

import { monitoringApi } from "@/api/monitoring"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { ResourceChart } from "@/components/metrics/ResourceChart"
import { ServerTable } from "@/components/dashboard/ServerTable"
import { PageContainer } from "@/components/common/PageContainer"
import { Section } from "@/components/common/Section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMetrics } from "@/hooks/useMetrics"
import { useServers } from "@/hooks/useServers"

/**
 * 控制台首页 — 全局资源总览
 * 数据来源:useServers(Zustand store + WS 实时)/ useMetrics(TanStack Query + WS 实时)
 * 活动事件经 monitoringApi.getActivityEvents
 */
export function Dashboard() {
  const { servers, loading } = useServers()
  const { data: metrics, isLoading: metricsLoading } = useMetrics("24h")
  const { data: events } = useQuery({
    queryKey: ["activity-events"],
    queryFn: () => monitoringApi.getActivityEvents(),
    staleTime: 60_000,
  })

  return (
    <PageContainer size="wide" className="py-2">
      {/* 1. 概览统计卡 */}
      <DashboardStats />

      {/* 2. 服务器总览 + 快捷操作 */}
      <Section header={false} className="py-6">
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm">服务器总览</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <a href="#/servers">查看全部 →</a>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {loading && servers.length === 0 ? (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <ServerTable servers={servers.slice(0, 5)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickActions />
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 3. 资源监控(实时) */}
      <Section header={false} className="pb-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <ResourceChart
            title="CPU 使用率"
            unit="%"
            labels={metrics?.labels ?? []}
            series={[
              {
                name: "CPU",
                color: "text-primary",
                data: metrics?.cpu ?? [],
              },
            ]}
            loading={metricsLoading}
          />
          <ResourceChart
            title="内存使用率"
            unit="%"
            labels={metrics?.labels ?? []}
            series={[
              {
                name: "Memory",
                color: "text-primary",
                data: metrics?.memory ?? [],
              },
            ]}
            loading={metricsLoading}
          />
          <ResourceChart
            title="网络流量"
            unit=" MB/s"
            labels={metrics?.labels ?? []}
            series={[
              { name: "In", color: "text-primary", data: metrics?.networkIn ?? [] },
              { name: "Out", color: "text-success", data: metrics?.networkOut ?? [] },
            ]}
            loading={metricsLoading}
          />
        </div>
      </Section>

      {/* 4. 最近事件 */}
      <Section header={false} className="pb-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">最近事件</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ActivityTimeline events={(events ?? []).slice(0, 6)} />
          </CardContent>
        </Card>
      </Section>
    </PageContainer>
  )
}
