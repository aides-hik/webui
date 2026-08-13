import { Eye, Shield, Wrench } from "lucide-react"

import { PageContainer } from "@/components/common/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { roles } from "@/services/mockAuth"
import type { RoleScope } from "@/types/auth"

const SCOPE_META: Record<RoleScope, { label: string; color: string }> = {
  all: { label: "全部资源", color: "bg-primary/15 text-primary" },
  team: { label: "团队资源", color: "bg-warning/15 text-warning" },
  assigned: { label: "指定资源", color: "bg-muted text-muted-foreground" },
}

const ROLE_ICON: Record<string, React.ElementType> = {
  admin: Shield,
  operator: Wrench,
  viewer: Eye,
}

/**
 * 角色管理(展示) — 角色 × 权限 × 资源范围
 */
export function Roles() {
  return (
    <PageContainer size="wide" className="py-2">
      <div className="mb-4">
        <h2 className="text-title text-xl">角色</h2>
        <p className="text-caption mt-0.5">
          角色定义权限集合与资源范围(scope):all 全部 / team 团队 / assigned 显式分配
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => {
          const Icon = ROLE_ICON[role.name] ?? Shield
          const scope = SCOPE_META[role.scope]
          return (
            <Card key={role.id} className="shadow-soft-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div>
                    <CardTitle className="text-sm">{role.label}</CardTitle>
                    <p className="text-caption mt-0.5">{role.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${scope.color}`}>
                  {scope.label} · {role.scope}
                </span>
                <div>
                  <p className="text-caption mb-1.5">权限({role.permissions.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="font-mono text-[10px]">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </PageContainer>
  )
}
