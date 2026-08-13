/* ============================================================
   团队模型(Resource Scope 隔离)
   ------------------------------------------------------------
   Server.ownerTeamId → Team.id
   角色 scope="team" 时,权限仅适用于所属团队拥有的资源。
   ============================================================ */

export interface Team {
  id: string
  name: string
  /** 成员 userId 列表 */
  members: string[]
  description?: string
}

/** 服务器环境 */
export type ServerEnvironment = "production" | "staging" | "development"

/** 服务器级权限点(ServerAccess 分配粒度) */
export type ServerScope = "view" | "manage" | "terminal" | "docker"

export interface ServerAssignment {
  userId: string
  serverId: string
  scopes: ServerScope[]
}
