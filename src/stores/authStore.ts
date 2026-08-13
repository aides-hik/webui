/* ============================================================
   认证 Store(Zustand)
   - 当前用户 / Token / 角色 / 权限
   - login / logout / hasPermission / hasRole
   - 持久化到 localStorage(刷新保持登录)
   ============================================================ */

import { create } from "zustand"

import { setAuthTokenProvider, setOnUnauthorized } from "@/api/client"
import * as mockAuth from "@/services/mockAuth"
import { recordAudit } from "@/services/mockAudit"
import { userHasPermission } from "@/services/permissionService"
import type { PermissionId, Role, User } from "@/types/auth"

const AUTH_KEY = "webui-auth"

interface AuthState {
  user: User | null
  token: string | null

  login: (username: string, password: string) => Promise<void>
  logout: () => void
  /** 权限判断;带 resourceId 时叠加资源范围(团队/分配)校验 */
  hasPermission: (permission: PermissionId, resourceId?: string) => boolean
  hasRole: (roleName: string) => boolean
  /** 演示:以指定用户直接登录 */
  loginAs: (username: string) => Promise<void>
}

function loadPersistedUser(): { user: User | null; token: string | null } {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return { user: null, token: null }
    const { userId, token } = JSON.parse(raw) as { userId: string; token: string }
    const user = mockAuth.mockUsers.find((u) => u.id === userId) ?? null
    return { user: user ? { ...user, roles: [...user.roles] } : null, token }
  } catch {
    return { user: null, token: null }
  }
}

const persisted = loadPersistedUser()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: persisted.user,
  token: persisted.token,

  login: async (username, password) => {
    try {
      const { user, token } = await mockAuth.login(username, password)
      set({ user, token })
      localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id, token }))
      recordAudit({
        userId: user.id,
        username: user.username,
        action: "auth.login",
        resourceType: "console",
      })
    } catch (err) {
      recordAudit({
        userId: "-",
        username,
        action: "auth.login_failed",
        resourceType: "console",
        status: "failed",
        metadata: { reason: err instanceof Error ? err.message : "未知错误" },
      })
      throw err
    }
  },

  logout: () => {
    const user = get().user
    if (user) {
      recordAudit({
        userId: user.id,
        username: user.username,
        action: "auth.logout",
        resourceType: "console",
      })
    }
    set({ user: null, token: null })
    localStorage.removeItem(AUTH_KEY)
  },

  hasPermission: (permission, resourceId) => {
    const user = get().user
    if (!user) return false
    return userHasPermission(user, permission, resourceId)
  },

  hasRole: (roleName) => {
    const user = get().user
    if (!user) return false
    return user.roles.some((r) => r.name === roleName)
  },

  loginAs: async (username) => {
    const user = mockAuth.mockUsers.find((u) => u.username === username)
    if (!user) throw new Error(`用户不存在: ${username}`)
    if (user.status === "disabled") throw new Error("该账号已被禁用")
    const token = `mock_jwt_${user.username}_${Date.now().toString(36)}`
    user.lastLogin = new Date().toISOString()
    set({ user: { ...user, roles: [...user.roles] }, token })
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id, token }))
    recordAudit({
      userId: user.id,
      username: user.username,
      action: "auth.login",
      resourceType: "console",
    })
  },
}))

/* ---------- 接入 API 客户端 ---------- */

setAuthTokenProvider(() => useAuthStore.getState().token)

setOnUnauthorized(() => {
  // 401:会话失效,自动登出并回到登录页
  useAuthStore.getState().logout()
  if (window.location.hash && !window.location.hash.startsWith("#/login")) {
    window.location.hash = "#/login"
  }
})

export type { Role }
