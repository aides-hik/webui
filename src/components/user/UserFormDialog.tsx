import { useEffect, useState } from "react"

import { RoleBadge } from "@/components/user/RoleBadge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Role, User } from "@/types/auth"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 传入用户则为编辑模式,否则为创建 */
  user?: User | null
  /** 可选角色列表(由 Users 页经 userApi.listRoles 提供) */
  roles: Role[]
  onSubmit: (data: { username: string; email: string; roleIds: string[]; status: User["status"] }) => void
}

/**
 * 创建 / 编辑用户 — 支持多角色分配
 */
export function UserFormDialog({ open, onOpenChange, user, roles, onSubmit }: UserFormDialogProps) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [status, setStatus] = useState<User["status"]>("active")
  const isEdit = Boolean(user)

  useEffect(() => {
    if (open) {
      setUsername(user?.username ?? "")
      setEmail(user?.email ?? "")
      setRoleIds(user?.roles.map((r) => r.id) ?? [])
      setStatus(user?.status ?? "active")
    }
  }, [open, user])

  const toggleRole = (roleId: string) => {
    setRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const handleSubmit = () => {
    if (!username.trim() || !email.trim()) return
    if (roleIds.length === 0) return
    onSubmit({ username: username.trim(), email: email.trim(), roleIds, status })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑用户" : "创建用户"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改用户信息与角色分配。" : "创建新用户并分配角色。"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uf-username">用户名</Label>
              <Input
                id="uf-username"
                value={username}
                disabled={isEdit && user?.username === "admin"}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf-email">邮箱</Label>
              <Input
                id="uf-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* 角色分配 */}
          <div className="space-y-2">
            <Label>角色分配(可多选)</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {roles.map((role) => {
                const selected = roleIds.includes(role.id)
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <RoleBadge role={role} />
                    <span className="text-caption line-clamp-2">{role.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 状态 */}
          <div className="space-y-2">
            <Label>状态</Label>
            <div className="flex gap-2">
              {(["active", "disabled"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={status === s ? "secondary" : "outline"}
                  onClick={() => setStatus(s)}
                >
                  {s === "active" ? "正常" : "禁用"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!username.trim() || !email.trim() || roleIds.length === 0}
          >
            {isEdit ? "保存修改" : "创建用户"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
