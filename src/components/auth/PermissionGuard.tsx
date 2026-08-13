import * as React from "react"

import { useAuthStore } from "@/stores/authStore"
import type { PermissionId } from "@/types/auth"

interface PermissionGuardProps {
  /** 所需权限;缺省时仅要求已登录 */
  permission?: PermissionId
  /** 资源 ID(服务器等):叠加 Resource Scope 校验 */
  resourceId?: string
  /** 无权限时的替代内容(默认 null = 隐藏) */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * 权限守卫组件 — 无权限时隐藏子树
 * 用法:
 *   <PermissionGuard permission="server.delete"><Button>删除</Button></PermissionGuard>
 *   <PermissionGuard permission="terminal.access" resourceId={server.id}>
 *     <TerminalTabs … />
 *   </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  resourceId,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const allowed =
    user !== null &&
    (permission === undefined || hasPermission(permission, resourceId))

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
