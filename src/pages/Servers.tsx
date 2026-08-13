import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/PermissionGuard"

import { PageContainer } from "@/components/common/PageContainer"
import { ServerCard } from "@/components/server/ServerCard"
import { ServerFormDialog } from "@/components/server/ServerFormDialog"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useServers } from "@/hooks/useServers"
import { useServerStore } from "@/stores/serverStore"
import { useAuthStore } from "@/stores/authStore"
import { recordAudit } from "@/services/mockAudit"
import { filterAccessibleServers } from "@/services/permissionService"
import { PERMISSIONS } from "@/types/auth"
import type { NewServerInput, Server } from "@/types/server"

/**
 * 服务器管理 — 搜索 / 添加 / 编辑 / 删除 / 进入详情
 * 数据:useServers + serverStore(CRUD 经 serverApi,Mock/Real 自动切换)
 */
export function Servers() {
  const { servers: allServers, loading } = useServers()
  const addServer = useServerStore((s) => s.addServer)
  const updateServer = useServerStore((s) => s.updateServer)
  const removeServer = useServerStore((s) => s.removeServer)
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.hasRole("admin"))

  /** Resource Scope:过滤当前用户可访问的服务器 */
  const servers = useMemo(() => {
    if (!currentUser || isAdmin) return allServers
    return filterAccessibleServers(currentUser, allServers)
  }, [allServers, currentUser, isAdmin])

  const audit = (action: "server.create" | "server.update" | "server.delete", resourceId: string, metadata?: Record<string, unknown>) => {
    recordAudit({
      userId: currentUser?.id ?? "-",
      username: currentUser?.username ?? "unknown",
      action,
      resourceType: "server",
      resourceId,
      metadata,
    })
  }
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Server | null>(null)
  const [deleting, setDeleting] = useState<Server | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return servers
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ip.includes(q) ||
        s.region.toLowerCase().includes(q)
    )
  }, [servers, query])

  const stats = useMemo(() => {
    const online = servers.filter((s) => s.status === "online").length
    const active = servers.filter((s) => s.status !== "offline")
    const totalCpu = active.reduce((a, s) => a + s.cpu, 0)
    return {
      total: servers.length,
      online,
      avgCpu: active.length ? Math.round(totalCpu / active.length) : 0,
    }
  }, [servers])

  const handleAdd = async (data: NewServerInput) => {
    try {
      const server = await addServer(data)
      audit("server.create", server.id, { name: server.name, ip: server.ip })
      toast.success("服务器已添加", {
        description: `${data.name} · ${data.ip}`,
      })
    } catch (err) {
      toast.error("添加失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
  }

  const handleEdit = async (data: NewServerInput) => {
    if (!editing) return
    try {
      await updateServer(editing.id, data)
      audit("server.update", editing.id, { name: data.name, ip: data.ip })
      toast.success("服务器已更新", {
        description: `${data.name} · ${data.ip}`,
      })
      setEditing(null)
    } catch (err) {
      toast.error("更新失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await removeServer(deleting.id)
      audit("server.delete", deleting.id, { name: deleting.name, ip: deleting.ip })
      toast.success("服务器已删除", { description: deleting.name })
      setDeleting(null)
    } catch (err) {
      toast.error("删除失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    }
  }

  return (
    <PageContainer size="wide" className="py-2">
      {/* 页头 */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-title text-xl">服务器</h2>
          <p className="text-caption mt-0.5">
            {stats.total} 台服务器 · {stats.online} 在线 · 平均 CPU {stats.avgCpu}%
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索名称 / IP / 区域…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-48 pl-8 text-xs sm:w-64"
            />
          </div>
          <PermissionGuard permission={PERMISSIONS.SERVER_CREATE}>
            <Button size="sm" asChild>
              <Link to="/servers/add">
                <Plus />
                添加服务器
              </Link>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Separator className="my-4" />

      {/* 服务器卡片网格 */}
      {loading && servers.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-body-sm">未找到匹配的服务器</p>
          <p className="text-caption">尝试其他关键词,或添加新服务器</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onEdit={(s) => {
                setEditing(s)
                setFormOpen(true)
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {/* 新增 / 编辑 */}
      <ServerFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        server={editing}
        onSubmit={editing ? handleEdit : handleAdd}
      />

      {/* 删除确认 */}
      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除服务器</DialogTitle>
            <DialogDescription>
              确定要删除 <span className="font-medium text-foreground">{deleting?.name}</span>
              ({deleting?.ip}) 吗?此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
