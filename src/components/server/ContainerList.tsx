import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Play, RotateCcw, Square } from "lucide-react"
import { toast } from "sonner"

import { monitoringApi } from "@/api/monitoring"
import { useAuthStore } from "@/stores/authStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Container, ContainerStatus } from "@/types/docker"
import { cn } from "@/lib/utils"

interface ContainerListProps {
  serverId?: string
  className?: string
}

/**
 * Docker 容器列表 — 查看 / 启停 / 重启
 * 数据:monitoringApi.containers / containerAction(审计在 mock 实现/服务端完成)
 */
export function ContainerList({ serverId, className }: ContainerListProps) {
  const { data: initial, isLoading } = useQuery({
    queryKey: ["containers", serverId ?? "platform"],
    queryFn: () => monitoringApi.containers(serverId),
  })
  const currentUser = useAuthStore((s) => s.user)
  const [containers, setContainers] = useState<Container[] | null>(null)

  const list = containers ?? initial ?? []

  const stats = useMemo(() => {
    const running = list.filter((c) => c.status === "running").length
    const stopped = list.filter((c) => c.status === "stopped").length
    const exited = list.filter((c) => c.status === "exited").length
    return { total: list.length, running, stopped, exited }
  }, [list])

  /** 乐观更新 + 下发操作;失败时回滚 */
  const act = async (container: Container, next: ContainerStatus, label: string) => {
    const action = label === "停止" ? "stop" : "start"
    setContainers((prev) =>
      (prev ?? initial ?? []).map((c) =>
        c.id === container.id ? { ...c, status: next } : c
      )
    )
    try {
      await monitoringApi.containerAction(
        container.id,
        action,
        currentUser
          ? { userId: currentUser.id, username: currentUser.username }
          : undefined,
        serverId
      )
      toast.success(`${container.name} 已${label}(mock)`, {
        description: `操作经 Agent 下发 · ${container.image}`,
      })
    } catch (err) {
      // 回滚乐观更新
      setContainers((prev) =>
        (prev ?? initial ?? []).map((c) =>
          c.id === container.id ? { ...container } : c
        )
      )
      toast.error(`${container.name} 操作失败`, {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
  }

  if (isLoading && !containers) {
    return (
      <Card className={className}>
        <CardContent className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          容器列表
          <span className="font-mono text-[10px] font-normal text-muted-foreground">
            {stats.total} 个 · {stats.running} 运行中 · {stats.stopped + stats.exited} 已停止
          </span>
        </CardTitle>
      </CardHeader>
      {list.length === 0 ? (
        <CardContent>
          <p className="text-caption py-8 text-center">暂无容器</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>名称</TableHead>
              <TableHead>镜像</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>端口</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((container) => {
              const running = container.status === "running"
              return (
                <TableRow key={container.id}>
                  <TableCell className="font-medium">{container.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {container.image}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "px-1.5 py-0 text-[10px]",
                        running
                          ? "border-transparent bg-success/15 text-success"
                          : "border-transparent bg-muted text-muted-foreground"
                      )}
                    >
                      {container.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {container.ports}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {running ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => act(container, "stopped", "停止")}
                        >
                          <Square />
                          停止
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-success"
                          onClick={() => act(container, "running", "启动")}
                        >
                          <Play />
                          启动
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => toast.success(`${container.name} 重启请求已发送(mock)`)}
                      >
                        <RotateCcw />
                        重启
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      )}
    </Card>
  )
}