import { useEffect, useMemo, useState } from "react"
import { CheckSquare, Save } from "lucide-react"
import { toast } from "sonner"

import { accessApi } from "@/api/access"
import { teamApi } from "@/api/team"
import { userApi } from "@/api/user"
import { serverApi } from "@/api/server"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PageContainer } from "@/components/common/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/stores/authStore"
import { PERMISSIONS } from "@/types/auth"
import type { Server } from "@/types/server"
import type { ServerAssignment, ServerScope, Team } from "@/types/team"
import type { User } from "@/types/auth"
import { cn } from "@/lib/utils"

const SCOPE_META: { key: ServerScope; label: string; hint: string }[] = [
  { key: "view", label: "查看", hint: "查看服务器与指标" },
  { key: "manage", label: "管理", hint: "重启/编辑等运维操作" },
  { key: "terminal", label: "终端", hint: "打开 Web 终端" },
  { key: "docker", label: "Docker", hint: "容器启停/管理" },
]

/** 从分配列表构建 用户 → 服务器 → scopes 矩阵 */
function buildMatrix(assignments: ServerAssignment[], userId: string): Record<string, ServerScope[]> {
  const map: Record<string, ServerScope[]> = {}
  for (const a of assignments) {
    if (a.userId === userId) map[a.serverId] = [...a.scopes]
  }
  return map
}

/**
 * 服务器访问分配 — 管理员按用户 × 服务器 × 权限点授权
 * 对应 role.scope="assigned" 的用户(viewer)可访问范围
 * 数据:userApi / teamApi / serverApi / accessApi(Mock/Real 自动切换)
 */
export function ServerAccess() {
  const currentUser = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [servers, setServers] = useState<Server[]>([])
  const [assignments, setAssignments] = useState<ServerAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [query, setQuery] = useState("")
  const [matrix, setMatrix] = useState<Record<string, ServerScope[]>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all([
      userApi.list(),
      teamApi.list(),
      serverApi.list(),
      accessApi.getAssignments(),
    ])
      .then(([userList, teamList, serverPage, assignmentList]) => {
        if (cancelled) return
        setUsers(userList)
        setTeams(teamList)
        setServers(serverPage.items)
        setAssignments(assignmentList)
        const firstId = userList[0]?.id ?? ""
        setSelectedUserId(firstId)
        setMatrix(buildMatrix(assignmentList, firstId))
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error("加载访问分配失败", {
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

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const visibleServers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return servers
    return servers.filter(
      (s) => s.name.toLowerCase().includes(q) || s.ip.includes(q) || s.region.toLowerCase().includes(q)
    )
  }, [query, servers])

  const loadUserAssignments = (userId: string) => {
    setSelectedUserId(userId)
    setMatrix(buildMatrix(assignments, userId))
  }

  const toggleScope = (serverId: string, scope: ServerScope) => {
    setMatrix((prev) => {
      const current = prev[serverId] ?? []
      const next = current.includes(scope)
        ? current.filter((s) => s !== scope)
        : [...current, scope]
      return { ...prev, [serverId]: next }
    })
  }

  const saveAssignments = async () => {
    if (!selectedUser) return
    const list: ServerAssignment[] = []
    for (const [serverId, scopes] of Object.entries(matrix)) {
      if (scopes.length > 0) {
        list.push({ userId: selectedUser.id, serverId, scopes })
      }
    }
    try {
      const saved = await accessApi.saveAssignments(
        list,
        currentUser
          ? { userId: currentUser.id, username: currentUser.username }
          : undefined
      )
      setAssignments(saved)
      toast.success("访问分配已保存", {
        description: `${selectedUser.username} · ${saved.length} 台服务器`,
      })
    } catch (err) {
      toast.error("保存失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
  }

  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-title text-xl">服务器访问</h2>
          <p className="text-caption mt-0.5">
            按 用户 × 服务器 分配访问权限 · 生效于 scope=&quot;assigned&quot; 的角色
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckSquare className="h-3 w-3" />
            {teams.length} 个团队
          </Badge>
          <PermissionGuard permission={PERMISSIONS.USER_MANAGE}>
            <Button size="sm" onClick={saveAssignments}>
              <Save />
              保存分配
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* 用户列表 */}
          <Card className="h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">用户</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => loadUserAssignments(user.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    user.id === selectedUserId ? "bg-primary/10 text-primary" : "hover:bg-muted/60"
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{user.username}</span>
                    <span className="text-caption block">
                      {user.roles.map((r) => r.label).join("/")}
                    </span>
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* 分配矩阵 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {selectedUser?.username} 的服务器权限
                <span className="text-caption ml-2 font-normal">
                  {selectedUser?.roles.some((r) => r.scope === "assigned")
                    ? "此用户为 assigned 范围,分配即时生效"
                    : "此用户角色为 all/team 范围,分配作为附加授权"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3 flex items-center gap-2">
                <Input
                  placeholder="搜索服务器名称 / IP / 区域…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 w-64 text-xs"
                />
                <span className="text-caption">共 {visibleServers.length} 台</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">服务器</th>
                      <th className="py-2 pr-2 font-medium">团队</th>
                      <th className="py-2 pr-2 font-medium">环境</th>
                      {SCOPE_META.map((s) => (
                        <th key={s.key} className="py-2 text-center font-medium">
                          {s.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleServers.map((server) => {
                      const scopes = matrix[server.id] ?? []
                      const team = teams.find((t) => t.id === server.ownerTeamId)
                      return (
                        <tr key={server.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-2">
                            <span className="font-medium">{server.name}</span>
                            <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                              {server.ip}
                            </span>
                          </td>
                          <td className="py-2 pr-2">
                            <Badge variant="outline" className="text-[10px]">
                              {team?.name ?? "—"}
                            </Badge>
                          </td>
                          <td className="py-2 pr-2">
                            <span className="text-caption">{server.environment}</span>
                          </td>
                          {SCOPE_META.map((s) => {
                            const checked = scopes.includes(s.key)
                            return (
                              <td key={s.key} className="py-2 text-center">
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={checked}
                                  aria-label={`${server.name} ${s.label}`}
                                  title={s.hint}
                                  onClick={() => toggleScope(server.id, s.key)}
                                  className={cn(
                                    "inline-flex h-5 w-5 items-center justify-center rounded border transition-colors",
                                    checked
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:border-primary/50"
                                  )}
                                >
                                  {checked && (
                                    <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-2">
                                      <path d="M2 6.5L4.5 9L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
