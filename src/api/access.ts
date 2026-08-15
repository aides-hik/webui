/* ============================================================
   服务器访问分配 API
   - getAssignments / saveAssignments
   - Mock 实现维护 mockPermission.assignments(与 ServerAccess 页面
     原「原地变异」行为一致),保存时写入 user.role_change 审计。
   - 模块加载时向 permissionService 注册资源范围数据提供者,
     供 assigned / team 权限判定使用。
   ============================================================ */

import { api } from "@/api/client"
import { mockUsers } from "@/services/mockAuth"
import { recordAudit } from "@/services/mockAudit"
import { assignments, serverTeamMap } from "@/services/mockPermission"
import { setScopeDataProvider } from "@/services/permissionService"
import type { AuditActor } from "@/types/audit"
import type { ServerAssignment } from "@/types/team"

export interface AccessApi {
  getAssignments(): Promise<ServerAssignment[]>
  saveAssignments(
    list: ServerAssignment[],
    actor?: AuditActor
  ): Promise<ServerAssignment[]>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

const copyAssignments = (list: ServerAssignment[]) =>
  list.map((a) => ({ ...a, scopes: [...a.scopes] }))

const mockAccessApi: AccessApi = {
  getAssignments: async () => copyAssignments(assignments),

  saveAssignments: async (list, actor) => {
    // 与页面原逻辑一致:整体替换,仅保留非空 scopes
    assignments.length = 0
    for (const a of list) {
      if (a.scopes.length > 0) assignments.push({ ...a, scopes: [...a.scopes] })
    }
    const target = list[0]
      ? mockUsers.find((u) => u.id === list[0].userId)
      : undefined
    recordAudit({
      userId: actor?.userId ?? "-",
      username: actor?.username ?? "-",
      action: "user.role_change",
      resourceType: "user",
      resourceId: target?.username ?? "-",
      metadata: { type: "server_assignment", servers: assignments.length },
    })
    return copyAssignments(assignments)
  },
}

const realAccessApi: AccessApi = {
  getAssignments: () => api.get<ServerAssignment[]>("/access/assignments"),
  saveAssignments: (list) =>
    api.put<ServerAssignment[]>("/access/assignments", { assignments: list }),
}

export const accessApi: AccessApi = USE_MOCK ? mockAccessApi : realAccessApi

/* 注册资源范围数据提供者(见 permissionService.setScopeDataProvider)。
   api/index 桶在应用入口 main.tsx 引入,测试在 setup 引入,保证先于权限判定。 */
setScopeDataProvider({ assignments, serverTeamMap })
