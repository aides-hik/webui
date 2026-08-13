import { useNavigate } from "react-router-dom"
import { MoreHorizontal } from "lucide-react"

import { ResourceBar, ServerStatusBadge } from "@/components/server/ServerStatus"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Server } from "@/lib/mock-data"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"

interface ServerTableProps {
  servers: Server[]
  onEdit?: (server: Server) => void
  onDelete?: (server: Server) => void
}

/**
 * 服务器列表表格(高信息密度)
 * 行点击进入详情;Actions 提供编辑/删除
 */
export function ServerTable({ servers, onEdit, onDelete }: ServerTableProps) {
  const navigate = useNavigate()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canDelete = hasPermission("server.delete")

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>服务器名称</TableHead>
          <TableHead>IP 地址</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>CPU</TableHead>
          <TableHead>内存</TableHead>
          <TableHead>磁盘</TableHead>
          <TableHead>区域</TableHead>
          <TableHead className="w-12 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servers.map((server) => (
          <TableRow
            key={server.id}
            className="cursor-pointer"
            onClick={() => navigate(`/servers/${server.id}`)}
          >
            <TableCell className="font-medium">{server.name}</TableCell>
            <TableCell>
              <span className="font-mono text-xs text-muted-foreground">
                {server.ip}
              </span>
            </TableCell>
            <TableCell>
              <ServerStatusBadge status={server.status} />
            </TableCell>
            <TableCell>
              <ResourceCell value={server.cpu} />
            </TableCell>
            <TableCell>
              <ResourceCell value={server.memory} />
            </TableCell>
            <TableCell>
              <ResourceCell value={server.disk} />
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-[10px]">
                {server.region}
              </Badge>
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`${server.name} 操作`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/servers/${server.id}`)}>
                    查看详情
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(server)}>
                    编辑
                  </DropdownMenuItem>
                  {canDelete && (
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </div>
  )
}

function ResourceCell({ value }: { value: number }) {
  return (
    <div className="flex w-24 items-center gap-2">
      <ResourceBar value={value} className="flex-1" />
      <span
        className={cn(
          "w-9 shrink-0 text-right font-mono text-xs",
          value >= 85 ? "text-destructive" : value >= 60 ? "text-warning" : "text-muted-foreground"
        )}
      >
        {value}%
      </span>
    </div>
  )
}
