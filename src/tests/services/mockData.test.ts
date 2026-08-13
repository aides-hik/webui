import { describe, expect, it } from "vitest"

import { auditLogs, recordAudit } from "@/services/mockAudit"
import { assignments, serverEnvMap, serverTeamMap, teams } from "@/services/mockPermission"
import { mockUsers } from "@/services/mockAuth"
import { servers } from "@/lib/mock-data"
import type { AuditLog } from "@/types/audit"
import type { Team } from "@/types/team"

describe("mockAuth 数据结构", () => {
  it("用户满足 User 模型", () => {
    for (const user of mockUsers) {
      expect(user).toMatchObject({
        id: expect.any(String),
        username: expect.any(String),
        email: expect.stringContaining("@"),
        status: expect.stringMatching(/^(active|disabled)$/),
        lastLogin: expect.any(String),
        createdAt: expect.any(String),
      })
      expect(Array.isArray(user.roles)).toBe(true)
      expect(Array.isArray(user.teamIds)).toBe(true)
    }
  })
})

describe("mockPermission 数据结构", () => {
  it("团队满足 Team 模型且成员有效", () => {
    const userIds = new Set(mockUsers.map((u) => u.id))
    for (const team of teams) {
      const t: Team = team
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      for (const memberId of t.members) {
        expect(userIds.has(memberId)).toBe(true)
      }
    }
  })

  it("分配记录引用有效用户与服务器", () => {
    const serverIds = new Set(servers.map((s) => s.id))
    for (const a of assignments) {
      expect(serverIds.has(a.serverId)).toBe(true)
      expect(mockUsers.some((u) => u.id === a.userId)).toBe(true)
      expect(a.scopes.length).toBeGreaterThan(0)
    }
  })

  it("服务器归属映射覆盖全部服务器且环境合法", () => {
    for (const server of servers) {
      expect(serverTeamMap[server.id]).toBeTruthy()
      expect(["production", "staging", "development"]).toContain(serverEnvMap[server.id])
      expect(server.ownerTeamId).toBe(serverTeamMap[server.id])
      expect(server.environment).toBe(serverEnvMap[server.id])
    }
  })
})

describe("mockAudit 数据结构", () => {
  it("种子审计日志满足 AuditLog 模型", () => {
    for (const log of auditLogs) {
      const l: AuditLog = log
      expect(l.id).toBeTruthy()
      expect(l.username).toBeTruthy()
      expect(["success", "failed"]).toContain(l.status)
      expect(new Date(l.createdAt).getTime()).not.toBeNaN()
      expect(l.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
    }
  })

  it("recordAudit 追加新记录到头部并限制容量", () => {
    const before = auditLogs.length
    recordAudit({ userId: "usr-01", username: "admin", action: "server.restart", resourceType: "server", resourceId: "srv-test" })
    expect(auditLogs.length).toBe(before + 1)
    expect(auditLogs[0].action).toBe("server.restart")
    expect(auditLogs[0].status).toBe("success")
  })

  it("auditLogs 按时间倒序排列", () => {
    for (let i = 1; i < auditLogs.length; i += 1) {
      expect(auditLogs[i - 1].createdAt >= auditLogs[i].createdAt).toBe(true)
    }
  })

  it("种子数据覆盖关键操作类型", () => {
    const actions = new Set(auditLogs.map((l) => l.action))
    for (const expected of ["auth.login", "server.create", "container.start", "terminal.command", "user.role_change"]) {
      expect(actions.has(expected as AuditLog["action"])).toBe(true)
    }
  })
})
