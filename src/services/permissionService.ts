/* ============================================================
   权限服务 — Resource Scope 判断
   ------------------------------------------------------------
   权限链:User → Team → Role → Permission → Resource Scope
   判断规则(带资源时):
   1. 用户任一角色拥有该权限
   2. 该角色的 scope 覆盖目标资源:
      - "all"      → 全部资源
      - "team"     → 资源 ownerTeamId ∈ 用户 teamIds
      - "assigned" → 资源在用户的显式分配列表(scopes 含对应权限)
   ============================================================ */

import { assignments, serverTeamMap } from "@/services/mockPermission"
import type { PermissionId, User } from "@/types/auth"
import type { Server } from "@/types/server"
import type { ServerScope } from "@/types/team"

/* ---------- 权限 ↔ 服务器级 scope 映射 ---------- */

const PERMISSION_TO_SCOPE: Partial<Record<PermissionId, ServerScope>> = {
  "server.view": "view",
  "server.manage": "manage",
  "terminal.access": "terminal",
  "docker.manage": "docker",
  "docker.view": "docker",
}

/** 用户对某服务器的显式分配 */
function getAssignment(user: User, serverId: string) {
  return assignments.find((a) => a.userId === user.id && a.serverId === serverId)
}

/**
 * 用户是否拥有权限(可带资源范围)
 * - 无 resourceId:仅角色层判断(全局能力;assigned 角色不提供全局能力)
 * - 带 resourceId:叠加 scope 判断
 * - assigned 角色:资源分配是独立授权通道,不要求角色权限集合包含该权限
 */
export function userHasPermission(
  user: User,
  permission: PermissionId,
  resourceId?: string
): boolean {
  const granted = user.roles.filter(
    (r) => r.permissions.includes(permission) || r.scope === "assigned"
  )
  if (granted.length === 0) return false

  const serverScope = PERMISSION_TO_SCOPE[permission]

  // 无资源维度:非资源权限按角色集合判断;服务器级权限仅全局角色(非 assigned)提供能力
  if (resourceId === undefined) {
    if (serverScope) {
      return granted.some(
        (r) => r.scope !== "assigned" && r.permissions.includes(permission)
      )
    }
    return granted.some((r) => r.permissions.includes(permission))
  }

  for (const role of granted) {
    switch (role.scope) {
      case "all":
        return true
      case "team": {
        if (!role.permissions.includes(permission)) break
        // 资源归属团队 → 用户所属团队
        const ownerTeamId = serverTeamMap[resourceId]
        if (ownerTeamId && user.teamIds.includes(ownerTeamId)) return true
        break
      }
      case "assigned": {
        if (!serverScope) break
        const assignment = getAssignment(user, resourceId)
        if (assignment && assignment.scopes.includes(serverScope)) return true
        break
      }
    }
  }
  return false
}

/* ---------- 服务器级便捷判断 ---------- */

/** 可查看服务器 */
export function canAccessServer(user: User, server: Server): boolean {
  return userHasPermission(user, "server.view", server.id)
}

/** 可管理服务器(重启/编辑) */
export function canManageServer(user: User, server: Server): boolean {
  return userHasPermission(user, "server.manage", server.id)
}

/** 可打开服务器终端 */
export function canExecuteTerminal(user: User, server: Server): boolean {
  return userHasPermission(user, "terminal.access", server.id)
}

/** 可管理服务器 Docker */
export function canManageDocker(user: User, server: Server): boolean {
  return userHasPermission(user, "docker.manage", server.id)
}

/** 过滤用户可见的服务器列表 */
export function filterAccessibleServers(user: User, servers: Server[]): Server[] {
  return servers.filter((s) => canAccessServer(user, s))
}
