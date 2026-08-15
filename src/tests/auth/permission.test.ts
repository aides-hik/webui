import { beforeEach, describe, expect, it } from "vitest"

import { useAuthStore } from "@/stores/authStore"
import { mockUsers } from "@/services/mockAuth"
import { auditLogs } from "@/services/mockAudit"

function resetAuth() {
  useAuthStore.setState({ user: null, token: null, initializing: false })
  localStorage.clear()
}

describe("authStore — 认证与权限", () => {
  beforeEach(() => {
    resetAuth()
    auditLogs.length = 0
  })

  it("初始状态未登录", () => {
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it("login() 成功:设置用户与 token,并写入 localStorage", async () => {
    await useAuthStore.getState().login("admin", "admin123")
    const state = useAuthStore.getState()
    expect(state.user?.username).toBe("admin")
    expect(state.token).toMatch(/^mock_jwt_/)
    expect(localStorage.getItem("webui-auth")).toContain("usr-01")
  })

  it("login() 密码错误:抛出异常且不登录", async () => {
    await expect(useAuthStore.getState().login("admin", "wrong")).rejects.toThrow()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("login() 禁用账号:拒绝登录", async () => {
    await expect(useAuthStore.getState().login("wangsong", "123456")).rejects.toThrow(
      /禁用/
    )
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("login() deploy-bot 演示账号可登录", async () => {
    await useAuthStore.getState().login("deploy-bot", "123456")
    const state = useAuthStore.getState()
    expect(state.user?.username).toBe("deploy-bot")
    expect(state.token).toMatch(/^mock_jwt_/)
  })

  it("logout() 清空会话", async () => {
    await useAuthStore.getState().login("admin", "admin123")
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem("webui-auth")).toBeNull()
  })

  it("hasRole() 按角色判断", async () => {
    await useAuthStore.getState().login("admin", "admin123")
    expect(useAuthStore.getState().hasRole("admin")).toBe(true)
    expect(useAuthStore.getState().hasRole("operator")).toBe(false)
  })

  it("hasPermission() 全局权限", async () => {
    await useAuthStore.getState().login("admin", "admin123")
    const { hasPermission } = useAuthStore.getState()
    expect(hasPermission("server.delete")).toBe(true)
    expect(hasPermission("user.manage")).toBe(true)
  })

  it("hasPermission() 资源级:operator 仅本团队服务器", async () => {
    await useAuthStore.getState().login("zhangwei", "123456")
    const { hasPermission } = useAuthStore.getState()
    expect(hasPermission("server.view", "srv-prod-api-01")).toBe(true)
    expect(hasPermission("server.view", "srv-staging-web-01")).toBe(false)
    expect(hasPermission("terminal.access", "srv-prod-api-01")).toBe(true)
  })

  it("hasPermission() 资源级:viewer 仅分配范围", async () => {
    await useAuthStore.getState().login("chenyu", "123456")
    const { hasPermission } = useAuthStore.getState()
    expect(hasPermission("server.view", "srv-staging-web-01")).toBe(true)
    expect(hasPermission("server.view", "srv-prod-api-01")).toBe(false)
    expect(hasPermission("terminal.access", "srv-staging-web-01")).toBe(false)
  })

  it("loginAs() 演示登录直接生效", async () => {
    await useAuthStore.getState().loginAs("lina")
    expect(useAuthStore.getState().user?.username).toBe("lina")
    expect(useAuthStore.getState().hasPermission("docker.manage", "srv-staging-web-01")).toBe(true)
  })

  it("init() 用持久化 token 恢复会话;无效 token 清除会话", async () => {
    await useAuthStore.getState().login("admin", "admin123")
    const token = useAuthStore.getState().token!

    // 模拟页面刷新:localStorage 有 token,user 丢失,进入初始化
    useAuthStore.setState({ user: null, token, initializing: true })
    await useAuthStore.getState().init()

    const restored = useAuthStore.getState()
    expect(restored.user?.username).toBe("admin")
    expect(restored.initializing).toBe(false)

    // 无效 token → 会话被清除
    useAuthStore.setState({ user: null, token: "invalid-token", initializing: true })
    await useAuthStore.getState().init()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem("webui-auth")).toBeNull()
  })

  it("登录与登出写入审计记录", async () => {
    await useAuthStore.getState().login("admin", "admin123")
    useAuthStore.getState().logout()
    const actions = auditLogs.map((l) => l.action)
    expect(actions).toContain("auth.login")
    expect(actions).toContain("auth.logout")
  })

  it("登录失败写入 failed 审计", async () => {
    await expect(useAuthStore.getState().login("admin", "bad")).rejects.toThrow()
    const failed = auditLogs.find((l) => l.action === "auth.login_failed")
    expect(failed?.status).toBe("failed")
  })

  it("mockUsers 数据被 store 正确引用", () => {
    expect(mockUsers.length).toBeGreaterThanOrEqual(6)
  })
})
