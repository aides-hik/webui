import { useMemo, useState } from "react"
import { Plus, Users as UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PageContainer } from "@/components/common/PageContainer"
import { UserFormDialog } from "@/components/user/UserFormDialog"
import { UserTable } from "@/components/user/UserTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockUsers as initialUsers, roles } from "@/services/mockAuth"
import { recordAudit } from "@/services/mockAudit"
import { useAuthStore } from "@/stores/authStore"
import { PERMISSIONS, type User } from "@/types/auth"
import type { AuditAction } from "@/types/audit"

const roleNameOf = (id: string) => roles.find((r) => r.id === id)

/**
 * 用户与权限管理
 * - 创建 / 编辑用户,多角色分配
 * - 禁用 / 启用用户
 * - 管理操作受 user.manage 权限控制
 */
export function Users() {
  const currentUser = useAuthStore((s) => s.user)
  const [list, setList] = useState<User[]>(initialUsers)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const stats = useMemo(() => {
    const counts: { admin: number; operator: number; viewer: number } = {
      admin: 0,
      operator: 0,
      viewer: 0,
    }
    for (const user of list) {
      for (const role of user.roles) {
        if (role.name in counts) counts[role.name as keyof typeof counts] += 1
      }
    }
    return {
      total: list.length,
      active: list.filter((u) => u.status === "active").length,
      ...counts,
    }
  }, [list])

  const auditUser = (action: AuditAction, resourceId: string, metadata?: Record<string, unknown>) => {
    recordAudit({
      userId: currentUser?.id ?? "-",
      username: currentUser?.username ?? "unknown",
      action,
      resourceType: "user",
      resourceId,
      metadata,
    })
  }

  const handleCreate = (data: { username: string; email: string; roleIds: string[]; status: User["status"] }) => {
    const user: User = {
      id: `usr-${Date.now().toString(36)}`,
      username: data.username,
      email: data.email,
      roles: data.roleIds.map((id) => roleNameOf(id)!).filter(Boolean),
      teamIds: [],
      status: data.status,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    setList((prev) => [user, ...prev])
    auditUser("user.create", user.username)
    toast.success("用户已创建", { description: `${user.username} · ${user.email}` })
  }

  const handleEdit = (data: { username: string; email: string; roleIds: string[]; status: User["status"] }) => {
    if (!editing) return
    const rolesChanged =
      data.roleIds.length !== editing.roles.length ||
      data.roleIds.some((id, i) => id !== editing.roles[i]?.id)
    setList((prev) =>
      prev.map((u) =>
        u.id === editing.id
          ? {
              ...u,
              username: data.username,
              email: data.email,
              roles: data.roleIds.map((id) => roleNameOf(id)!).filter(Boolean),
              status: data.status,
            }
          : u
      )
    )
    if (rolesChanged) auditUser("user.role_change", editing.username)
    auditUser("user.update", editing.username)
    toast.success("用户已更新", { description: data.username })
    setEditing(null)
  }

  const handleToggleStatus = (user: User) => {
    if (user.username === "admin") {
      toast.error("不能禁用 admin 账号")
      return
    }
    const next: User["status"] = user.status === "active" ? "disabled" : "active"
    setList((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)))
    auditUser("user.disable", user.username)
    toast.success(next === "disabled" ? "用户已禁用" : "用户已启用", {
      description: user.username,
    })
  }

  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-title text-xl">用户</h2>
          <p className="text-caption mt-0.5">
            共 {stats.total} 人 · {stats.active} 正常 · 管理员 {stats.admin} · 运维 {stats.operator} · 只读{" "}
            {stats.viewer}
          </p>
        </div>
        <div className="ml-auto">
          <PermissionGuard permission={PERMISSIONS.USER_MANAGE}>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus />
              创建用户
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            用户列表
          </CardTitle>
          <span className="text-caption">角色:管理员 / 运维 / 只读</span>
        </CardHeader>
        <CardContent className="pt-0">
          <UserTable
            users={list}
            onEdit={(user) => {
              setEditing(user)
              setFormOpen(true)
            }}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        user={editing}
        onSubmit={editing ? handleEdit : handleCreate}
      />
    </PageContainer>
  )
}
