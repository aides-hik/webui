import { useQuery } from "@tanstack/react-query"
import { Cpu, HardDrive, MemoryStick, Network } from "lucide-react"

import { monitoringApi } from "@/api/monitoring"
import { MetricCard } from "@/components/metrics/MetricCard"
import { NetworkChart } from "@/components/metrics/NetworkChart"
import { ResourceChart } from "@/components/metrics/ResourceChart"
import { PageContainer } from "@/components/common/PageContainer"
import { useMetrics } from "@/hooks/useMetrics"

const last = (arr: number[] | undefined) => (arr && arr.length > 0 ? arr[arr.length - 1] : 0)

/**
 * 监控中心 — 服务器实时指标
 * CPU / 内存(Swap)/ 磁盘(IO)/ 网络(上下行)
 * 存储类指标经 monitoringApi.getStorageMetrics(Mock/Real 自动切换)
 */
export function Metrics() {
  const { data: metrics, isLoading } = useMetrics("24h")
  const { data: storage } = useQuery({
    queryKey: ["storage-metrics"],
    queryFn: () => monitoringApi.getStorageMetrics(),
    staleTime: 60_000,
  })

  const cpuNow = last(metrics?.cpu)
  const memNow = last(metrics?.memory)
  const diskNow = storage?.diskUsage ?? 0
  const netInNow = last(metrics?.networkIn)
  const netOutNow = last(metrics?.networkOut)
  const labels = storage?.labels ?? []
  const swap = storage?.swap ?? []
  const diskRead = storage?.diskRead ?? []
  const diskWrite = storage?.diskWrite ?? []
  const diskHistory = storage?.diskHistory ?? []

  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4">
        <h2 className="text-title text-xl">监控</h2>
        <p className="text-caption mt-0.5">服务器实时指标 · 每 3 秒自动刷新</p>
      </div>

      {/* 当前值卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="CPU 使用率"
          value={String(cpuNow)}
          unit="%"
          delta="-4.2%"
          deltaUp={false}
          icon={Cpu}
          spark={metrics?.cpu}
        />
        <MetricCard
          label="内存使用率"
          value={String(memNow)}
          unit="%"
          delta="+1.8%"
          deltaUp
          icon={MemoryStick}
          spark={metrics?.memory}
        />
        <MetricCard
          label="磁盘使用率"
          value={String(diskNow)}
          unit="%"
          delta="+0.6%"
          deltaUp
          icon={HardDrive}
          spark={diskHistory}
        />
        <MetricCard
          label="网络吞吐"
          value={String(Math.round((netInNow + netOutNow) / 10) / 10)}
          unit="MB/s"
          delta="+12.4%"
          deltaUp
          icon={Network}
          spark={metrics?.networkIn}
          sparkColor="text-success"
        />
      </div>

      {/* 历史趋势 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ResourceChart
          title="CPU 使用率(历史趋势)"
          unit="%"
          labels={labels}
          series={[{ name: "CPU", color: "text-primary", data: metrics?.cpu ?? [] }]}
          loading={isLoading}
        />
        <ResourceChart
          title="内存使用率(含 Swap)"
          unit="%"
          labels={labels}
          series={[
            { name: "内存", color: "text-primary", data: metrics?.memory ?? [] },
            { name: "Swap", color: "text-warning", data: swap },
          ]}
          loading={isLoading}
        />
        <ResourceChart
          title="磁盘 IO"
          unit=" MB/s"
          labels={labels}
          series={[
            { name: "读", color: "text-primary", data: diskRead },
            { name: "写", color: "text-success", data: diskWrite },
          ]}
        />
        <NetworkChart
          title="网络流量(上传 / 下载)"
          upload={metrics?.networkOut ?? []}
          download={metrics?.networkIn ?? []}
          labels={labels}
          loading={isLoading}
        />
      </div>

      <p className="text-caption mt-4 text-center">
        Swap 与磁盘 IO 为静态 Mock 数据;真实架构经 Agent → Metrics Collector → 时序数据库。
      </p>
    </PageContainer>
  )
}
