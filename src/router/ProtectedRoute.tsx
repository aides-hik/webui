import * as React from "react"
import { Navigate, useLocation } from "react-router-dom"

import { ForbiddenPage } from "@/pages/ForbiddenPage"
import { useAuthStore } from "@/stores/authStore"
import type { PermissionId } from "@/types/auth"

interface ProtectedRouteProps {
  /** 所需权限;缺省时仅要求已登录 */
  permission?: PermissionId
  children: React.ReactNode
}

/**
 * 路由守卫
 * - 未登录 → 跳转登录页(记录来源,登录后回跳)
 * - 已登录但无权限 → 403 页面
 */
export function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (permission !== undefined && !hasPermission(permission)) {
    return <ForbiddenPage />
  }

  return <>{children}</>
}
