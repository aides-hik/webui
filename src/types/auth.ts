/* ============================================================
   RBAC 权限模型
   ------------------------------------------------------------
   User →(多)Role →(多)Permission
   一个用户可拥有多个角色;一个角色包含多个权限。
   前端按权限做 UI 级控制,真实授权以服务端校验为准。
   ============================================================ */

/* ---------- 权限 ---------- */

export const PERMISSIONS = {
  SERVER_VIEW: "server.view",
  SERVER_CREATE: "server.create",
  SERVER_DELETE: "server.delete",
  SERVER_MANAGE: "server.manage",
  TERMINAL_ACCESS: "terminal.access",
  DOCKER_VIEW: "docker.view",
  DOCKER_MANAGE: "docker.manage",
  LOGS_VIEW: "logs.view",
  METRICS_VIEW: "metrics.view",
  USER_MANAGE: "user.manage",
  SETTINGS_MANAGE: "settings.manage",
  AUDIT_VIEW: "audit.view",
} as const

export type PermissionId = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export interface Permission {
  id: PermissionId
  name: string
  description: string
}

/* ---------- 角色 ---------- */

/** 角色资源范围:
 *  all      — 全部资源(Admin)
 *  team     — 所属团队的资源(Operator)
 *  assigned — 仅显式分配的资源(Viewer)
 */
export type RoleScope = "all" | "team" | "assigned"

export interface Role {
  id: string
  name: string // admin | operator | viewer
  label: string
  description: string
  permissions: PermissionId[]
  scope: RoleScope
}

/* ---------- 用户 ---------- */

export type UserStatus = "active" | "disabled"

export interface User {
  id: string
  username: string
  email: string
  roles: Role[] // 多角色
  /** 所属团队(scope="team" 的资源范围) */
  teamIds: string[]
  status: UserStatus
  lastLogin: string // ISO
  createdAt: string // ISO
}

/* ---------- 会话 ---------- */

export interface AuthSession {
  user: User
  token: string
}

export interface LoginResult {
  user: User
  token: string
}
