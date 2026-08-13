import { Pencil, ShieldOff, ShieldCheck } from "lucide-react"

import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { RoleBadge } from "@/components/user/RoleBadge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { PERMISSIONS } from "@/types/auth"
import type { User } from "@/types/auth"

function formatLastLogin(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return "刚刚"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

interface UserTableProps {
  users: User[]
  onEdit?: (user: User) => void
  onToggleStatus?: (user: User) => void
}

/**
 * 用户列表 — 多角色徽章 / 编辑 / 禁用启用
 */
export function UserTable({ users, onEdit, onToggleStatus }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>用户名</TableHead>
          <TableHead>邮箱</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>最后登录</TableHead>
          <TableHead className="w-28 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const disabled = user.status === "disabled"
          const initials = user.username.slice(0, 2).toUpperCase()
          return (
            <TableRow key={user.id} className={cn(disabled && "opacity-60")}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-muted text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.username}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <RoleBadge key={role.id} role={role} />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      disabled ? "bg-muted-foreground/50" : "bg-success"
                    )}
                    aria-hidden
                  />
                  {disabled ? "已禁用" : "正常"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {formatLastLogin(user.lastLogin)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <PermissionGuard permission={PERMISSIONS.USER_MANAGE}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onEdit?.(user)}
                    >
                      <Pencil />
                      编辑
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission={PERMISSIONS.USER_MANAGE}>
                    {disabled ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-success"
                        onClick={() => onToggleStatus?.(user)}
                      >
                        <ShieldCheck />
                        启用
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => onToggleStatus?.(user)}
                      >
                        <ShieldOff />
                        禁用
                      </Button>
                    )}
                  </PermissionGuard>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
    </div>
  )
}
