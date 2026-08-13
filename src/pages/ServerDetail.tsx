import { Link, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, ShieldX } from "lucide-react"

import { PageContainer } from "@/components/common/PageContainer"
import { ServerDetailTabs } from "@/components/server/ServerDetailTabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useServers } from "@/hooks/useServers"
import { useAuthStore } from "@/stores/authStore"

/**
 * 服务器详情 — Resource Scope 守卫
 * 非 admin 需 server.view 且资源范围覆盖(团队/分配)才可访问
 */
export function ServerDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.hasRole("admin"))
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const { servers, loading } = useServers()
  const server = servers.find((s) => s.id === id)

  /* 首次进入 store 为空:拉取期间展示骨架屏 */
  if (loading && !server) {
    return (
      <PageContainer size="wide" className="py-2">
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
      </PageContainer>
    )
  }

  if (!server) {
    return (
      <PageContainer className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="text-xl font-semibold">服务器不存在</h1>
        <p className="text-caption">该服务器可能已被删除。</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/servers">返回服务器列表</Link>
        </Button>
      </PageContainer>
    )
  }

  /* 服务器级访问控制 */
  const canView = isAdmin || (user !== null && hasPermission("server.view", server.id))

  if (!canView) {
    return (
      <PageContainer className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="h-8 w-8 text-destructive" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">无权限访问此服务器</h1>
          <p className="text-body-sm mt-2 max-w-sm">
            你的账号未被分配 {server.name} 的访问权限。请联系管理员在「服务器访问」中分配。
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/servers">返回服务器列表</Link>
        </Button>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="wide" className="py-2">
      {/* 页头 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
          <Link to="/servers">
            <ArrowLeft />
            返回
          </Link>
        </Button>
        <div>
          <h2 className="text-title text-xl">{server.name}</h2>
          <p className="font-mono mt-0.5 text-xs text-muted-foreground">
            {server.ip} · {server.region} · {server.os}
          </p>
        </div>
      </div>

      <ServerDetailTabs server={server} defaultTab={searchParams.get("tab") ?? "overview"} />
    </PageContainer>
  )
}
