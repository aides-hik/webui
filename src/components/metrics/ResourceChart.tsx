import { useEffect, useMemo, useRef, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface ChartSeries {
  name: string
  color: string // tailwind 色类,如 text-primary
  data: number[]
}

interface ResourceChartProps {
  title: string
  unit?: string
  series: ChartSeries[]
  labels?: string[]
  height?: number
  loading?: boolean
  className?: string
}

const VIEW_W = 640
const PAD = { top: 16, right: 12, bottom: 24, left: 44 }

interface HoverInfo {
  index: number
  x: number
  y: number
}

/**
 * 轻量 SVG 面积/折线图
 * - 渐变面积填充 + 入场绘制动画
 * - 悬停显示竖线与数值浮层
 * - 支持多系列(如网络入/出流量)
 */
export function ResourceChart({
  title,
  unit = "%",
  series,
  labels,
  height = 220,
  loading = false,
  className,
}: ResourceChartProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [drawn, setDrawn] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const { w, h, maxVal, yTicks } = useMemo(() => {
    const w = VIEW_W
    const h = height
    const all = series.flatMap((s) => s.data)
    const rawMax = Math.max(...all, 1)
    const maxVal = Math.ceil((rawMax * 1.15) / 10) * 10
    const yTicks = 4
    return { w, h, maxVal, yTicks }
  }, [series, height])

  const plotW = w - PAD.left - PAD.right
  const plotH = h - PAD.top - PAD.bottom

  const xAt = (i: number) =>
    PAD.left + (i / Math.max(series[0]?.data.length - 1, 1)) * plotW
  const yAt = (v: number) => PAD.top + (1 - v / maxVal) * plotH

  const buildPath = (data: number[]) => {
    const line = data
      .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
      .join(" ")
    const area = `${line} L${xAt(data.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${PAD.left},${(PAD.top + plotH).toFixed(1)} Z`
    return { line, area }
  }

  const gradientId = (name: string) => `grad-${name.replace(/[^a-z0-9]/gi, "")}`

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scale = rect.width / VIEW_W
    const mx = (e.clientX - rect.left) / scale
    const dataLen = series[0]?.data.length ?? 0
    if (!dataLen) return
    const idx = Math.round(((mx - PAD.left) / plotW) * (dataLen - 1))
    const clamped = Math.min(Math.max(idx, 0), dataLen - 1)
    setHover({
      index: clamped,
      x: Math.min(Math.max(xAt(clamped), PAD.left + 28), w - 28),
      y: yAt(Math.max(...series.map((s) => s.data[clamped]))),
    })
  }

  // 加载占位(置于所有 hooks 之后,保证 hook 调用顺序稳定)
  if (loading) {
    return (
      <div className={cn("rounded-lg border bg-card p-4 shadow-soft-sm", className)}>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="w-full" style={{ height }} />
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className={cn("rounded-lg border bg-card p-4 shadow-soft-sm", className)}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex items-center gap-3">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span
                className={cn("h-2 w-2 rounded-full", s.color)}
                aria-hidden
              />
              <span className="text-caption">{s.name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-auto w-full cursor-crosshair select-none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`${title} 图表`}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.name}
                id={gradientId(s.name)}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* 网格与 Y 轴 */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const y = PAD.top + (i / yTicks) * plotH
            const val = Math.round(maxVal - (i / yTicks) * maxVal)
            return (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={w - PAD.right}
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeDasharray={i === yTicks ? undefined : "3 3"}
                />
                <text
                  x={PAD.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* X 轴标签 */}
          {labels &&
            labels.map((label, i) =>
              i % Math.ceil(labels.length / 6) === 0 ? (
                <text
                  key={i}
                  x={xAt(i)}
                  y={h - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-mono"
                >
                  {label}
                </text>
              ) : null
            )}

          {/* 系列 */}
          {series.map((s) => {
            const { line, area } = buildPath(s.data)
            return (
              <g key={s.name} className={s.color}>
                <path d={area} fill={`url(#${gradientId(s.name)})`} />
                <path
                  d={line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: drawn ? 0 : 1,
                    transition: "stroke-dashoffset 1.2s ease-out",
                  }}
                />
              </g>
            )
          })}

          {/* 悬停指示 */}
          {hover && (
            <g>
              <line
                x1={xAt(hover.index)}
                x2={xAt(hover.index)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                className="stroke-muted-foreground/40"
                strokeDasharray="3 3"
              />
              {series.map((s) => (
                <circle
                  key={s.name}
                  cx={xAt(hover.index)}
                  cy={yAt(s.data[hover.index])}
                  r={3.5}
                  className="fill-background stroke-current"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>

        {/* 数值浮层 */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2.5 py-1.5 shadow-soft-sm"
            style={{
              left: `${(hover.x / VIEW_W) * 100}%`,
              top: `${(hover.y / h) * 100}%`,
              transform: "translate(-50%, -110%)",
            }}
          >
            <p className="font-mono text-[10px] text-muted-foreground">
              {labels?.[hover.index] ?? `#${hover.index + 1}`}
            </p>
            {series.map((s) => (
              <p key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className={cn("h-1.5 w-1.5 rounded-full", s.color)} />
                {s.name}: {s.data[hover.index]}
                {unit}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- 迷你趋势线(卡片内 sparkline) ---------- */

interface SparklineProps {
  data: number[]
  colorClass?: string
  className?: string
}

export function Sparkline({
  data,
  colorClass = "text-primary",
  className,
}: SparklineProps) {
  const w = 96
  const h = 32
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * w).toFixed(1)},${(
          h - 3 - ((v - min) / range) * (h - 6)
        ).toFixed(1)}`
    )
    .join(" ")
  const area = `0,${h} ${pts} ${w},${h}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-24", className)} aria-hidden>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} className={colorClass} fill="url(#spark-grad)" />
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorClass}
      />
    </svg>
  )
}
