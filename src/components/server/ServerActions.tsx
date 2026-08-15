import { useNavigate } from "react-router-dom"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Server } from "@/types/server"
import { useAuthStore } from "@/stores/authStore"

interface ServerActionsProps {
  server: Server
  onEdit?: (server: Server) => void
  onDelete?: (server: Server) => void
  /** 透传给触发按钮(如 shrink-0) */
  triggerClassName?: string
}

/**
 * 服务器操作菜单 — 查看详情 / 编辑 / 删除(删除按 server.delete 权限显隐)。
 * 供卡片视图(ServerCard)与表格视图(ServerTable)复用。
 */
export function ServerActions({ server, onEdit, onDelete, triggerClassName }: ServerActionsProps) {
  const navigate = useNavigate()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canDelete = hasPermission("server.delete")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerClassName ?? "h-7 w-7"}
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
  )
}
