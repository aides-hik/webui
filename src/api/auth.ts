/* ============================================================
   认证 API
   - login:用户名密码登录(成功/失败审计在 mock 实现内完成)
   - me:按持久化 Token 恢复会话(Mock 解析 mock_jwt_<username>_<ts>)
   - loginAs:演示账号直登(Mock 专属;真实模式抛错,UI 以 IS_MOCK 隐藏入口)
   注:auth.logout 审计为客户端事件,仍由 authStore 负责。
   ============================================================ */

import { api } from "@/api/client"
import * as mockAuth from "@/services/mockAuth"
import { recordAudit } from "@/services/mockAudit"
import type { LoginResult, User } from "@/types/auth"

export interface AuthApi {
  login(username: string, password: string): Promise<LoginResult>
  /** 无效 / 过期 / 被禁用 → null */
  me(token: string | null): Promise<User | null>
  loginAs(username: string): Promise<LoginResult>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

/** mock_jwt_<username>_<ts> → username;格式不符返回 null */
function parseMockToken(token: string): string | null {
  const prefix = "mock_jwt_"
  if (!token.startsWith(prefix)) return null
  const rest = token.slice(prefix.length)
  const lastUnderscore = rest.lastIndexOf("_")
  if (lastUnderscore <= 0) return null
  return rest.slice(0, lastUnderscore)
}

const mockAuthApi: AuthApi = {
  login: async (username, password) => {
    try {
      const result = await mockAuth.login(username, password)
      recordAudit({
        userId: result.user.id,
        username: result.user.username,
        action: "auth.login",
        resourceType: "console",
      })
      return result
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

  me: async (token) => {
    if (!token) return null
    const username = parseMockToken(token)
    const user = username
      ? mockAuth.mockUsers.find((u) => u.username === username)
      : undefined
    if (!user || user.status === "disabled") return null
    return { ...user, roles: [...user.roles] }
  },

  loginAs: async (username) => {
    const user = mockAuth.mockUsers.find((u) => u.username === username)
    if (!user) throw new Error(`用户不存在: ${username}`)
    if (user.status === "disabled") throw new Error("该账号已被禁用")
    user.lastLogin = new Date().toISOString()
    const result: LoginResult = {
      user: { ...user, roles: [...user.roles] },
      token: `mock_jwt_${user.username}_${Date.now().toString(36)}`,
    }
    recordAudit({
      userId: result.user.id,
      username: result.user.username,
      action: "auth.login",
      resourceType: "console",
    })
    return result
  },
}

const realAuthApi: AuthApi = {
  login: (username, password) =>
    api.post<LoginResult>("/auth/login", { username, password }),

  me: (token) => (token ? api.get<User>("/auth/me") : Promise.resolve(null)),

  loginAs: async () => {
    throw new Error("演示账号登录仅支持 Mock 模式")
  },
}

export const authApi: AuthApi = USE_MOCK ? mockAuthApi : realAuthApi
