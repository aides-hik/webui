/* ============================================================
   用户 / 角色 API
   - list / create / update / listRoles
   - Mock 实现直接维护 mockAuth.mockUsers(会话内持久),
     审计写入与页面原行为一致(user.create / user.update /
     user.role_change / user.disable)。
   ============================================================ */

import { api } from "@/api/client"
import { mockUsers, roles } from "@/services/mockAuth"
import { recordAudit } from "@/services/mockAudit"
import type { AuditActor } from "@/types/audit"
import type { Role, User, UserStatus } from "@/types/auth"

/** 创建用户输入(与 UserFormDialog 表单一致) */
export interface NewUserInput {
  username: string
  email: string
  roleIds: string[]
  status: UserStatus
}

/** 用户更新补丁;仅含 status 时视为启/禁用操作 */
export interface UserUpdateInput {
  username?: string
  email?: string
  roleIds?: string[]
  status?: UserStatus
}

export interface UserApi {
  list(): Promise<User[]>
  create(input: NewUserInput, actor?: AuditActor): Promise<User>
  update(id: string, patch: UserUpdateInput, actor?: AuditActor): Promise<User>
  listRoles(): Promise<Role[]>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

function roleById(id: string): Role {
  const role = roles.find((r) => r.id === id)
  if (!role) throw new Error(`角色不存在: ${id}`)
  return role
}

const copyUser = (u: User): User => ({ ...u, roles: [...u.roles] })
const actorOf = (actor?: AuditActor) => ({
  userId: actor?.userId ?? "-",
  username: actor?.username ?? "-",
})

const mockUserApi: UserApi = {
  list: async () => mockUsers.map(copyUser),

  create: async (input, actor) => {
    const user: User = {
      id: `usr-${Date.now().toString(36)}`,
      username: input.username,
      email: input.email,
      roles: input.roleIds.map(roleById),
      teamIds: [],
      status: input.status,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    mockUsers.unshift(user)
    recordAudit({
      ...actorOf(actor),
      action: "user.create",
      resourceType: "user",
      resourceId: user.username,
    })
    return copyUser(user)
  },

  update: async (id, patch, actor) => {
    const index = mockUsers.findIndex((u) => u.id === id)
    if (index === -1) throw new Error(`用户不存在: ${id}`)
    const prev = mockUsers[index]
    const oldUsername = prev.username

    const rolesChanged =
      patch.roleIds !== undefined &&
      (patch.roleIds.length !== prev.roles.length ||
        patch.roleIds.some((rid, i) => rid !== prev.roles[i]?.id))

    const next: User = {
      ...prev,
      username: patch.username ?? prev.username,
      email: patch.email ?? prev.email,
      roles: patch.roleIds ? patch.roleIds.map(roleById) : prev.roles,
      status: patch.status ?? prev.status,
    }
    mockUsers[index] = next

    // 仅改 status → 启/禁用操作;否则为编辑操作(角色变更时追加 role_change)
    const statusOnly =
      patch.roleIds === undefined &&
      patch.username === undefined &&
      patch.email === undefined
    if (statusOnly) {
      recordAudit({
        ...actorOf(actor),
        action: "user.disable",
        resourceType: "user",
        resourceId: oldUsername,
      })
    } else {
      if (rolesChanged) {
        recordAudit({
          ...actorOf(actor),
          action: "user.role_change",
          resourceType: "user",
          resourceId: oldUsername,
        })
      }
      recordAudit({
        ...actorOf(actor),
        action: "user.update",
        resourceType: "user",
        resourceId: oldUsername,
      })
    }
    return copyUser(next)
  },

  listRoles: async () => roles.map((r) => ({ ...r, permissions: [...r.permissions] })),
}

const realUserApi: UserApi = {
  list: () => api.get<User[]>("/users"),
  create: (input) => api.post<User>("/users", input),
  update: (id, patch) => api.put<User>(`/users/${id}`, patch),
  listRoles: () => api.get<Role[]>("/roles"),
}

export const userApi: UserApi = USE_MOCK ? mockUserApi : realUserApi
