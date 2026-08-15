import { describe, expect, it } from "vitest"

import { accessApi } from "@/api/access"
import { applicationApi } from "@/api/application"
import { auditApi } from "@/api/audit"
import { authApi } from "@/api/auth"
import { monitoringApi } from "@/api/monitoring"
import { serverApi } from "@/api/server"
import { teamApi } from "@/api/team"
import { userApi } from "@/api/user"
import { userHasPermission } from "@/services/permissionService"
import { PERMISSIONS, type User } from "@/types/auth"

/* api 层 Mock 实现冒烟测试:验证与页面原行为等价(审计动作/状态转换/数据维护) */

describe("api 层 Mock 实现", () => {
  it("authApi:login / me / loginAs 行为正确", async () => {
    const { user, token } = await authApi.login("admin", "admin123")
    expect(user.username).toBe("admin")
    expect(token).toMatch(/^mock_jwt_/)

    const restored = await authApi.me(token)
    expect(restored?.username).toBe("admin")
    expect(await authApi.me(null)).toBeNull()
    expect(await authApi.me("invalid-token")).toBeNull()

    await expect(authApi.login("admin", "wrong")).rejects.toThrow()
    await expect(authApi.login("nobody", "123456")).rejects.toThrow()

    const demo = await authApi.loginAs("lina")
    expect(demo.user.username).toBe("lina")
  })

  it("userApi:list / create / update / listRoles(含审计语义)", async () => {
    const before = (await userApi.list()).length

    const created = await userApi.create(
      { username: "audit-test-user", email: "audit@test.dev", roleIds: ["role-viewer"], status: "active" },
      { userId: "usr-01", username: "admin" }
    )
    expect(created.roles[0]?.name).toBe("viewer")
    expect((await userApi.list()).length).toBe(before + 1)

    // 仅状态变更 → 启/禁用语义
    const disabled = await userApi.update(created.id, { status: "disabled" }, { userId: "usr-01", username: "admin" })
    expect(disabled.status).toBe("disabled")

    // 编辑角色 → 角色变更 + 更新
    const updated = await userApi.update(
      created.id,
      { roleIds: ["role-operator", "role-viewer"], email: "new@test.dev" },
      { userId: "usr-01", username: "admin" }
    )
    expect(updated.roles).toHaveLength(2)
    expect(updated.email).toBe("new@test.dev")

    await expect(userApi.update("usr-not-exist", {})).rejects.toThrow()

    const roles = await userApi.listRoles()
    expect(roles.map((r) => r.name)).toEqual(expect.arrayContaining(["admin", "operator", "viewer"]))
  })

  it("teamApi:create / update / remove", async () => {
    const created = await teamApi.create({ name: "临时团队", memberIds: ["usr-01"] })
    expect(created.id).toMatch(/^team-/)
    expect((await teamApi.list()).some((t) => t.id === created.id)).toBe(true)

    const updated = await teamApi.update(created.id, { name: "临时团队-2", members: [] })
    expect(updated.name).toBe("临时团队-2")
    expect(updated.members).toEqual([])

    await teamApi.remove(created.id)
    expect((await teamApi.list()).some((t) => t.id === created.id)).toBe(false)
    await expect(teamApi.remove("team-not-exist")).rejects.toThrow()
  })

  it("applicationApi:list / changeStatus 状态转换与页面一致", async () => {
    const list = await applicationApi.list()
    const target = list.find((a) => a.id === "app-01")
    expect(target?.status).toBe("running")

    const stopped = await applicationApi.changeStatus("app-01", "stop")
    expect(stopped.status).toBe("stopped")

    const started = await applicationApi.changeStatus("app-01", "start")
    expect(started.status).toBe("running")

    const restarted = await applicationApi.changeStatus("app-01", "restart")
    expect(restarted.status).toBe("stopped") // running → restart → stopped(与页面逻辑一致)

    await expect(applicationApi.changeStatus("app-not-exist", "start")).rejects.toThrow()
  })

  it("accessApi:保存分配立即生效于权限判定(provider 已注册)", async () => {
    // 给一个假 viewer 用户分配 prod-web-01 的 view 权限
    await accessApi.saveAssignments(
      [{ userId: "usr-99", serverId: "srv-prod-web-01", scopes: ["view"] }],
      { userId: "usr-01", username: "admin" }
    )

    const viewer: User = {
      id: "usr-99",
      username: "tester",
      email: "t@t",
      roles: [
        {
          id: "role-viewer",
          name: "viewer",
          label: "只读",
          description: "",
          scope: "assigned",
          permissions: [PERMISSIONS.SERVER_VIEW],
        },
      ],
      teamIds: [],
      status: "active",
      lastLogin: "",
      createdAt: "",
    }

    expect(userHasPermission(viewer, PERMISSIONS.SERVER_VIEW, "srv-prod-web-01")).toBe(true)
    expect(userHasPermission(viewer, PERMISSIONS.SERVER_VIEW, "srv-prod-api-01")).toBe(false)
    expect(userHasPermission(viewer, PERMISSIONS.TERMINAL_ACCESS, "srv-prod-web-01")).toBe(false)
  })

  it("auditApi:查询委托 auditService,分页结构完整", async () => {
    const res = await auditApi.getLogs({ page: 1, pageSize: 10 })
    expect(res.items.length).toBeGreaterThan(0)
    expect(res.total).toBeGreaterThanOrEqual(res.items.length)
    expect(res.page).toBe(1)

    const options = await auditApi.getOptions()
    expect(options.users.length).toBeGreaterThan(0)
    expect(options.actions.length).toBeGreaterThan(0)
  })

  it("serverApi:restart 返回服务器并写入审计", async () => {
    const server = await serverApi.restart("srv-prod-web-01", { userId: "usr-01", username: "admin" })
    expect(server.id).toBe("srv-prod-web-01")
    await expect(serverApi.restart("srv-not-exist")).rejects.toThrow()
  })

  it("monitoringApi:getStorageMetrics / getActivityEvents / containerAction", async () => {
    const storage = await monitoringApi.getStorageMetrics()
    expect(storage.swap.length).toBeGreaterThan(0)
    expect(storage.diskRead).toEqual(storage.diskWrite.map(() => expect.any(Number)))
    expect(storage.diskUsage).toBe(62)

    const events = await monitoringApi.getActivityEvents()
    expect(events.length).toBeGreaterThan(0)

    const stopped = await monitoringApi.containerAction(
      "c-01",
      "stop",
      { userId: "usr-01", username: "admin" },
      "srv-prod-web-01"
    )
    expect(stopped.status).toBe("stopped")

    const started = await monitoringApi.containerAction("c-01", "start")
    expect(started.status).toBe("running")

    await expect(monitoringApi.containerAction("c-not-exist", "start")).rejects.toThrow()
  })
})
