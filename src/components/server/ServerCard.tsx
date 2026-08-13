import { useNavigate } from "react-router-dom"
import { Cpu, HardDrive, MemoryStick, MoreHorizontal } from "lucide-react"

import { ResourceBar, ServerStatusBadge } from "@/components/server/ServerStatus"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Server } from "@/lib/mock-data"
import { useAuthStore } from "@/stores/authStore"

interface ServerCardProps {
  server: Server
  onEdit?: (server: Server) => void
  onDelete?: (server: Server) => void
}

/**
 * 服务器卡片(网格视图)
 * 用于 Servers 页;包含资源条与快捷操作
 */
export function ServerCard({ server, onEdit, onDelete }: ServerCardProps) {
  const navigate = useNavigate()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  return (
    <Card className="flex h-full flex-col shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft">
      <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{server.name}</p>
            <ServerStatusBadge status={server.status} />
          </div>
          <p className="font-mono mt-1 text-xs text-muted-foreground">
            {server.ip}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label={`${server.name} 操作`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/servers/${server.id}`)}>
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(server)}>编辑</DropdownMenuItem>
            {hasPermission("server.delete") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(server)}
                >
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 p-4 pt-0">
        {[
          { label: "CPU", value: server.cpu, icon: Cpu },
          { label: "内存", value: server.memory, icon: MemoryStick },
          { label: "磁盘", value: server.disk, icon: HardDrive },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <r.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="w-14 shrink-0 text-xs text-muted-foreground">
              {r.label}
            </span>
            <ResourceBar value={r.value} className="flex-1" />
            <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {r.value}%
            </span>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <Badge variant="outline" className="font-mono text-[10px]">
          {server.region}
        </Badge>
        <span className="text-caption">{server.os.split(" ")[0]} · {server.cores} 核</span>
      </CardFooter>
    </Card>
  )
}
