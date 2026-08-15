import { useEffect, useMemo, useState } from "react"
import { Plus, Users as UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { userApi } from "@/api/user"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PageContainer } from "@/components/common/PageContainer"
import { UserFormDialog } from "@/components/user/UserFormDialog"
import { UserTable } from "@/components/user/UserTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/stores/authStore"
import { PERMISSIONS, type Role, type User } from "@/types/auth"

/**
 * 用户与权限管理
 * - 创建 / 编辑用户,多角色分配
 * - 禁用 / 启用用户(审计由 api mock 实现/服务端完成)
 * - 管理操作受 user.manage 权限控制
 */
export function Users() {
  const currentUser = useAuthStore((s) => s.user)
  const [list, setList] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const actor = currentUser
    ? { userId: currentUser.id, username: currentUser.username }
    : undefined

  useEffect(() => {
    let cancelled = false
    Promise.all([userApi.list(), userApi.listRoles()])
      .then(([users, roleList]) => {
        if (cancelled) return
        setList(users)
        setRoles(roleList)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error("加载用户失败", {
            description: err instanceof Error ? err.message : "未知错误",
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  const handleCreate = async (data: { username: string; email: string; roleIds: string[]; status: User["status"] }) => {
    try {
      const user = await userApi.create(data, actor)
      setList((prev) => [user, ...prev])
      toast.success("用户已创建", { description: `${user.username} · ${user.email}` })
    } catch (err) {
      toast.error("创建用户失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
  }

  const handleEdit = async (data: { username: string; email: string; roleIds: string[]; status: User["status"] }) => {
    if (!editing) return
    try {
      const updated = await userApi.update(editing.id, data, actor)
      setList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success("用户已更新", { description: data.username })
      setEditing(null)
    } catch (err) {
      toast.error("更新用户失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (user.username === "admin") {
      toast.error("不能禁用 admin 账号")
      return
    }
    const next: User["status"] = user.status === "active" ? "disabled" : "active"
    try {
      const updated = await userApi.update(user.id, { status: next }, actor)
      setList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success(next === "disabled" ? "用户已禁用" : "用户已启用", {
        description: user.username,
      })
    } catch (err) {
      toast.error("操作失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
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
          {loading && list.length === 0 ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <UserTable
              users={list}
              onEdit={(user) => {
                setEditing(user)
                setFormOpen(true)
              }}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        user={editing}
        roles={roles}
        onSubmit={editing ? handleEdit : handleCreate}
      />
    </PageContainer>
  )
}
