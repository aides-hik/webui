import { describe, expect, it } from "vitest"

import { mockUsers } from "@/services/mockAuth"
import { servers } from "@/lib/mock-data"
import {
  canAccessServer,
  canExecuteTerminal,
  canManageDocker,
  canManageServer,
  filterAccessibleServers,
  userHasPermission,
} from "@/services/permissionService"

const [admin, zhangwei, lina, chenyu] = mockUsers
const prod = servers.find((s) => s.id === "srv-prod-api-01")!
const staging = servers.find((s) => s.id === "srv-staging-web-01")!

describe("permissionService — 全局权限(无资源)", () => {
  it("Admin 拥有全部权限", () => {
    const perms = ["server.view", "server.create", "server.delete", "server.manage", "terminal.access", "docker.manage", "user.manage", "settings.manage", "audit.view"] as const
    for (const p of perms) {
      expect(userHasPermission(admin, p)).toBe(true)
    }
  })

  it("Operator 拥有运维权限,禁止管理类权限", () => {
    expect(userHasPermission(zhangwei, "server.view")).toBe(true)
    expect(userHasPermission(zhangwei, "server.manage")).toBe(true)
    expect(userHasPermission(zhangwei, "terminal.access")).toBe(true)
    expect(userHasPermission(zhangwei, "docker.manage")).toBe(true)
    expect(userHasPermission(zhangwei, "audit.view")).toBe(true)
    expect(userHasPermission(zhangwei, "server.delete")).toBe(false)
    expect(userHasPermission(zhangwei, "server.create")).toBe(false)
    expect(userHasPermission(zhangwei, "user.manage")).toBe(false)
    expect(userHasPermission(zhangwei, "settings.manage")).toBe(false)
  })

  it("Viewer 拥有只读权限,服务器级权限不提供全局能力", () => {
    expect(userHasPermission(chenyu, "metrics.view")).toBe(true)
    expect(userHasPermission(chenyu, "logs.view")).toBe(true)
    expect(userHasPermission(chenyu, "server.view")).toBe(false)
    expect(userHasPermission(chenyu, "terminal.access")).toBe(false)
    expect(userHasPermission(chenyu, "docker.manage")).toBe(false)
  })
})

describe("permissionService — 资源范围(Resource Scope)", () => {
  it("Admin(scope=all)可访问任何服务器", () => {
    expect(canAccessServer(admin, prod)).toBe(true)
    expect(canAccessServer(admin, staging)).toBe(true)
    expect(canExecuteTerminal(admin, staging)).toBe(true)
  })

  it("Operator(scope=team)仅限本团队服务器", () => {
    expect(canAccessServer(zhangwei, prod)).toBe(true)
    expect(canManageServer(zhangwei, prod)).toBe(true)
    expect(canExecuteTerminal(zhangwei, prod)).toBe(true)
    expect(canAccessServer(zhangwei, staging)).toBe(false)
    expect(canManageServer(zhangwei, staging)).toBe(false)
    expect(canManageDocker(zhangwei, staging)).toBe(false)
  })

  it("双团队用户(scope=team)可访问两个团队资源", () => {
    expect(canAccessServer(lina, prod)).toBe(true)
    expect(canAccessServer(lina, staging)).toBe(true)
  })

  it("Viewer(scope=assigned)仅限显式分配的服务器与权限点", () => {
    // 分配了 view + manage
    expect(canAccessServer(chenyu, staging)).toBe(true)
    expect(canManageServer(chenyu, staging)).toBe(true)
    // 未分配 terminal / docker
    expect(canExecuteTerminal(chenyu, staging)).toBe(false)
    expect(canManageDocker(chenyu, staging)).toBe(false)
    // 未分配任何权限的服务器
    expect(canAccessServer(chenyu, prod)).toBe(false)
  })

  it("列表过滤:Operator 可见本团队 5 台,Viewer 可见分配 2 台", () => {
    expect(filterAccessibleServers(zhangwei, servers)).toHaveLength(5)
    expect(filterAccessibleServers(chenyu, servers)).toHaveLength(2)
  })
})
