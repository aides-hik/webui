import { ResourceChart, type ChartSeries } from "@/components/metrics/ResourceChart"

interface NetworkChartProps {
  /** 入站流量 MB/s */
  upload: number[]
  /** 出站流量 MB/s */
  download: number[]
  labels?: string[]
  title?: string
  height?: number
  loading?: boolean
  className?: string
}

/**
 * 网络流量图 — 上传 / 下载双系列(封装 ResourceChart)
 */
export function NetworkChart({
  upload,
  download,
  labels,
  title = "网络流量",
  height,
  loading,
  className,
}: NetworkChartProps) {
  const series: ChartSeries[] = [
    { name: "上传", color: "text-primary", data: upload },
    { name: "下载", color: "text-success", data: download },
  ]

  return (
    <ResourceChart
      title={title}
      unit=" MB/s"
      labels={labels}
      series={series}
      height={height}
      loading={loading}
      className={className}
    />
  )
}
