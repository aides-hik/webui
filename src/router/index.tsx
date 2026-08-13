import { lazy, Suspense } from "react"
import { HashRouter, Route, Routes } from "react-router-dom"

import { PageLoader } from "@/components/common/PageLoader"
import { AppLayout } from "@/layouts/AppLayout"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { ProtectedRoute } from "@/router/ProtectedRoute"
import { PERMISSIONS } from "@/types/auth"

/** 命名导出 → React.lazy 适配器 */
const lazyPage = <T extends { [K in string]: unknown }>(
  loader: () => Promise<T>,
  componentKey: keyof T
) =>
  lazy(() => loader().then((m) => ({ default: m[componentKey] as React.ComponentType })))

const Applications = lazyPage(() => import("@/pages/Applications"), "Applications")
const Audit = lazyPage(() => import("@/pages/Audit"), "Audit")
const Dashboard = lazyPage(() => import("@/pages/Dashboard"), "Dashboard")
const DesignSystemPage = lazyPage(() => import("@/pages/DesignSystemPage"), "DesignSystemPage")
const Docker = lazyPage(() => import("@/pages/Docker"), "Docker")
const HomePage = lazyPage(() => import("@/pages/HomePage"), "HomePage")
const Login = lazyPage(() => import("@/pages/Login"), "Login")
const Logs = lazyPage(() => import("@/pages/Logs"), "Logs")
const Metrics = lazyPage(() => import("@/pages/Metrics"), "Metrics")
const NotFoundPage = lazyPage(() => import("@/pages/NotFoundPage"), "NotFoundPage")
const ServerAdd = lazyPage(() => import("@/pages/ServerAdd"), "ServerAdd")
const ServerDetail = lazyPage(() => import("@/pages/ServerDetail"), "ServerDetail")
const ServerTerminal = lazyPage(() => import("@/pages/ServerTerminal"), "ServerTerminal")
const Servers = lazyPage(() => import("@/pages/Servers"), "Servers")
const ServerAccess = lazyPage(() => import("@/pages/ServerAccess"), "ServerAccess")
const Teams = lazyPage(() => import("@/pages/Teams"), "Teams")
const Roles = lazyPage(() => import("@/pages/Roles"), "Roles")
const Settings = lazyPage(() => import("@/pages/Settings"), "Settings")
const Users = lazyPage(() => import("@/pages/Users"), "Users")

/**
 * 应用路由表(Hash Router)
 *
 * - 页面级 React.lazy + Suspense 按需加载
 * - /login 公开;控制台全部需要登录
 * - 高敏页面叠加权限守卫(如终端需要 terminal.access)
 */
export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
          </Route>

          {/* 控制台(需登录) */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/servers/add" element={<ServerAdd />} />
            <Route path="/servers/:id" element={<ServerDetail />} />
            <Route
              path="/servers/:id/terminal"
              element={
                <ProtectedRoute permission={PERMISSIONS.TERMINAL_ACCESS}>
                  <ServerTerminal />
                </ProtectedRoute>
              }
            />
            <Route path="/applications" element={<Applications />} />
            <Route
              path="/containers"
              element={
                <ProtectedRoute permission={PERMISSIONS.DOCKER_MANAGE}>
                  <Docker />
                </ProtectedRoute>
              }
            />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/users" element={<Users />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/roles" element={<Roles />} />
            <Route
              path="/access"
              element={
                <ProtectedRoute permission={PERMISSIONS.USER_MANAGE}>
                  <ServerAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute permission={PERMISSIONS.SETTINGS_MANAGE}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute permission={PERMISSIONS.AUDIT_VIEW}>
                  <Audit />
                </ProtectedRoute>
              }
            />
            </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
