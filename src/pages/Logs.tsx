import { LogsViewer } from "@/components/server/LogsViewer"
import { PageContainer } from "@/components/common/PageContainer"
import { Badge } from "@/components/ui/badge"

/**
 * 平台日志中心 — 实时日志流(WS logs:stream)
 */
export function Logs() {
  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-title text-xl">日志</h2>
          <p className="text-caption mt-0.5">
            平台与应用日志 · 实时流推送
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            实时流已连接
          </Badge>
        </div>
      </div>

      <LogsViewer height={560} />
    </PageContainer>
  )
}
