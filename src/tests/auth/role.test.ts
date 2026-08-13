import { describe, expect, it } from "vitest"

import { mockUsers, roles } from "@/services/mockAuth"
import { PERMISSIONS, type Role, type User } from "@/types/auth"

describe("角色定义(role.test)", () => {
  it("默认角色存在且 scope 符合设计", () => {
    const byName = Object.fromEntries(roles.map((r) => [r.name, r]))
    expect(byName.admin.scope).toBe("all")
    expect(byName.operator.scope).toBe("team")
    expect(byName.viewer.scope).toBe("assigned")
  })

  it("Admin 角色包含全部权限目录", () => {
    const admin = roles.find((r) => r.name === "admin")!
    const catalog = Object.values(PERMISSIONS)
    for (const p of catalog) {
      expect(admin.permissions).toContain(p)
    }
  })

  it("Operator 权限集合符合运维定位", () => {
    const operator = roles.find((r) => r.name === "operator")!
    for (const p of ["server.view", "server.manage", "terminal.access", "docker.manage", "logs.view", "audit.view"]) {
      expect(operator.permissions).toContain(p)
    }
    expect(operator.permissions).not.toContain("server.delete")
    expect(operator.permissions).not.toContain("user.manage")
    expect(operator.permissions).not.toContain("settings.manage")
  })

  it("Viewer 仅只读权限", () => {
    const viewer = roles.find((r) => r.name === "viewer")!
    expect(viewer.permissions).toEqual([
      "server.view",
      "metrics.view",
      "logs.view",
    ])
  })
})

describe("用户定义(mockUsers)", () => {
  it("用户持有有效角色与团队", () => {
    for (const user of mockUsers) {
      expect(user.roles.length).toBeGreaterThan(0)
      for (const role of user.roles) {
        expect(roles.map((r) => r.id)).toContain(role.id)
      }
      expect(Array.isArray(user.teamIds)).toBe(true)
    }
  })

  it("演示账号身份符合角色设定", () => {
    const byName = Object.fromEntries(mockUsers.map((u) => [u.username, u]))
    expect(byName.admin.roles[0].name).toBe("admin")
    expect(byName.zhangwei.roles[0].name).toBe("operator")
    expect(byName.chenyu.roles[0].name).toBe("viewer")
    expect(byName.chenyu.status).toBe("active")
    expect(byName.wangsong.status).toBe("disabled")
  })

  it("用户与团队归属一致(teamIds 有效)", () => {
    const teamIds = new Set(["team-prod", "team-staging"])
    for (const user of mockUsers) {
      for (const tid of user.teamIds) {
        expect(teamIds.has(tid)).toBe(true)
      }
    }
  })
})

describe("类型完整性", () => {
  it("User 满足 RBAC 数据模型", () => {
    const user: User = mockUsers[0]
    expect(typeof user.id).toBe("string")
    expect(Array.isArray(user.roles)).toBe(true)
    expect(Array.isArray(user.teamIds)).toBe(true)
    expect(["active", "disabled"]).toContain(user.status)
  })

  it("Role 满足权限模型", () => {
    const role: Role = roles[0]
    expect(typeof role.id).toBe("string")
    expect(typeof role.name).toBe("string")
    expect(["all", "team", "assigned"]).toContain(role.scope)
    expect(Array.isArray(role.permissions)).toBe(true)
  })
})
