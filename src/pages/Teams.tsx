import { useState } from "react"
import { Plus, Trash2, Users as UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PageContainer } from "@/components/common/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { mockUsers as users } from "@/services/mockAuth"
import { teams as initialTeams } from "@/services/mockPermission"
import { PERMISSIONS } from "@/types/auth"
import type { Team } from "@/types/team"
import { cn } from "@/lib/utils"

/**
 * 团队管理 — 创建团队 / 添加成员 / 分配成员角色
 * 团队是 scope="team" 角色的资源范围边界
 */
export function Teams() {
  const [list, setList] = useState<Team[]>(initialTeams)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [memberIds, setMemberIds] = useState<string[]>([])

  const openCreate = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setMemberIds([])
    setDialogOpen(true)
  }

  const openEdit = (team: Team) => {
    setEditingId(team.id)
    setName(team.name)
    setDescription(team.description ?? "")
    setMemberIds([...team.members])
    setDialogOpen(true)
  }

  const toggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const save = () => {
    if (!name.trim()) return
    if (editingId) {
      setList((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, name: name.trim(), description, members: memberIds } : t
        )
      )
      toast.success("团队已更新", { description: name })
    } else {
      const team: Team = {
        id: `team-${Date.now().toString(36)}`,
        name: name.trim(),
        description,
        members: memberIds,
      }
      setList((prev) => [...prev, team])
      toast.success("团队已创建", { description: `${name} · ${memberIds.length} 名成员` })
    }
    setDialogOpen(false)
  }

  const removeTeam = (team: Team) => {
    setList((prev) => prev.filter((t) => t.id !== team.id))
    toast.success("团队已删除", { description: team.name })
  }

  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-title text-xl">团队</h2>
          <p className="text-caption mt-0.5">
            scope=&quot;team&quot; 角色的资源范围 · 成员自动获得本团队服务器的运维权限
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.USER_MANAGE}>
          <Button size="sm" className="ml-auto" onClick={openCreate}>
            <Plus />
            创建团队
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((team) => (
          <Card key={team.id} className="shadow-soft-sm">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <UsersIcon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <CardTitle className="text-sm">{team.name}</CardTitle>
                  <p className="text-caption mt-0.5">{team.description}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <PermissionGuard permission={PERMISSIONS.USER_MANAGE}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(team)}>
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive"
                    onClick={() => removeTeam(team)}
                  >
                    <Trash2 />
                  </Button>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-caption mb-2">
                成员({team.members.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {team.members.map((memberId) => {
                  const member = users.find((u) => u.id === memberId)
                  if (!member) return null
                  return (
                    <Badge key={memberId} variant="outline" className="gap-1.5 font-normal">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                        {member.username.slice(0, 2).toUpperCase()}
                      </span>
                      {member.username}
                      <span className="text-[10px] text-muted-foreground">
                        {member.roles[0]?.label}
                      </span>
                    </Badge>
                  )
                })}
                {team.members.length === 0 && (
                  <span className="text-caption">暂无成员</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑团队" : "创建团队"}</DialogTitle>
            <DialogDescription>
              {editingId ? "调整团队名称与成员。" : "创建团队并将用户加入成员。"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="team-name">团队名称</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如:生产团队 / 测试团队"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-desc">描述</Label>
              <Input
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="团队职责说明(可选)"
              />
            </div>
            <div className="space-y-2">
              <Label>成员(勾选添加)</Label>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border p-2">
                {users.map((user) => {
                  const checked = memberIds.includes(user.id)
                  return (
                    <div key={user.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleMember(user.id)}
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {checked && (
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current stroke-2">
                            <path d="M2 6.5L4.5 9L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span className="flex-1 text-sm">{user.username}</span>
                      <span className="text-caption">{user.roles.map((r) => r.label).join("/")}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={save} disabled={!name.trim()}>
              {editingId ? "保存修改" : "创建团队"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
