import { ContainerList } from "@/components/server/ContainerList"
import { PageContainer } from "@/components/common/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/** 镜像 Mock 数据(未来:GET /api/docker/images) */
const IMAGES = [
  { id: "img-01", name: "nginx", tag: "1.25-alpine", size: "42.3 MB", created: "2 天前" },
  { id: "img-02", name: "node", tag: "20-slim", size: "188 MB", created: "3 天前" },
  { id: "img-03", name: "postgres", tag: "16", size: "432 MB", created: "7 天前" },
  { id: "img-04", name: "redis", tag: "7-alpine", size: "41.8 MB", created: "7 天前" },
  { id: "img-05", name: "python", tag: "3.11-slim", size: "145 MB", created: "1 天前" },
]

/**
 * Docker 管理 — 容器列表 / 启停 / 镜像
 */
export function Docker() {
  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4">
        <h2 className="text-title text-xl">Docker</h2>
        <p className="text-caption mt-0.5">
          容器与镜像管理 · 操作经 Agent 下发
        </p>
      </div>

      <ContainerList />

      {/* 镜像列表 */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            镜像列表
            <span className="font-mono text-[10px] font-normal text-muted-foreground">
              GET /api/docker/images
            </span>
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>镜像</TableHead>
              <TableHead>标签</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {IMAGES.map((image) => (
              <TableRow key={image.id}>
                <TableCell className="font-medium">{image.name}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {image.tag}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {image.size}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {image.created}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className="border-transparent bg-success/15 text-success">
                    已拉取
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">接口契约(未来)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 font-mono text-xs text-muted-foreground">
          <p>GET  /api/docker/containers      — 容器列表</p>
          <p>POST /api/docker/container/start — 启动容器</p>
          <p>POST /api/docker/container/stop  — 停止容器</p>
          <p>POST /api/docker/container/restart — 重启容器</p>
          <p>GET  /api/docker/images          — 镜像列表</p>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
