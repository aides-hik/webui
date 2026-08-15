/* ============================================================
   认证 Store(Zustand)
   - 当前用户 / Token / 角色 / 权限
   - login / logout / loginAs / init(会话恢复)
   - 持久化 token 到 localStorage;启动时经 authApi.me() 校验恢复
   - 登录/登录失败审计由 api/auth mock 实现写入;登出审计为本客户端事件
   ============================================================ */

import { create } from "zustand"

import { setAuthTokenProvider, setOnUnauthorized } from "@/api/client"
import { authApi } from "@/api/auth"
import { auditApi } from "@/api/audit"
import { userHasPermission } from "@/services/permissionService"
import type { PermissionId, Role, User } from "@/types/auth"

const AUTH_KEY = "webui-auth"

interface AuthState {
  user: User | null
  token: string | null
  /** 持久化会话恢复中(启动时 me() 校验,期间受保护路由显示加载态) */
  initializing: boolean

  init: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  /** 权限判断;带 resourceId 时叠加资源范围(团队/分配)校验 */
  hasPermission: (permission: PermissionId, resourceId?: string) => boolean
  hasRole: (roleName: string) => boolean
  /** 演示:以指定用户直接登录 */
  loginAs: (username: string) => Promise<void>
}

function loadToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const { token } = JSON.parse(raw) as { userId?: string; token?: string }
    return token ?? null
  } catch {
    return null
  }
}

const persistedToken = loadToken()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: persistedToken,
  initializing: persistedToken !== null,

  /** 启动时校验持久化会话;token 无效 / 用户被禁用时清除会话 */
  init: async () => {
    const token = get().token
    if (!token) {
      set({ initializing: false })
      return
    }
    try {
      const user = await authApi.me(token)
      if (user) {
        set({ user, initializing: false })
      } else {
        localStorage.removeItem(AUTH_KEY)
        set({ user: null, token: null, initializing: false })
      }
    } catch {
      localStorage.removeItem(AUTH_KEY)
      set({ user: null, token: null, initializing: false })
    }
  },

  login: async (username, password) => {
    const { user, token } = await authApi.login(username, password)
    set({ user, token })
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id, token }))
  },

  logout: () => {
    const user = get().user
    if (user) {
      auditApi.record({
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
    const { user, token } = await authApi.loginAs(username)
    set({ user, token })
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id, token }))
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
