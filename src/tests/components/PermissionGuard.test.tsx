import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { mockUsers } from "@/services/mockAuth"
import { useAuthStore } from "@/stores/authStore"

function loginAs(username: string) {
  const user = mockUsers.find((u) => u.username === username)!
  useAuthStore.setState({
    user: { ...user, roles: [...user.roles] },
    token: "test-token",
  })
}

function logout() {
  useAuthStore.setState({ user: null, token: null })
}

describe("PermissionGuard", () => {
  it("有权限时正常渲染子树", async () => {
    loginAs("admin")
    render(
      <PermissionGuard permission="terminal.access">
        <button>终端按钮</button>
      </PermissionGuard>
    )
    expect(screen.getByRole("button", { name: "终端按钮" })).toBeInTheDocument()
    logout()
  })

  it("无权限时隐藏子树", async () => {
    loginAs("chenyu") // viewer 无 terminal.access
    render(
      <PermissionGuard permission="terminal.access">
        <button>终端按钮</button>
      </PermissionGuard>
    )
    expect(screen.queryByRole("button", { name: "终端按钮" })).not.toBeInTheDocument()
    logout()
  })

  it("无权限时显示 fallback 内容", async () => {
    loginAs("chenyu")
    render(
      <PermissionGuard permission="terminal.access" fallback={<p>无权限提示</p>}>
        <button>终端按钮</button>
      </PermissionGuard>
    )
    expect(screen.getByText("无权限提示")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "终端按钮" })).not.toBeInTheDocument()
    logout()
  })

  it("带资源范围:同团队允许,异团队隐藏", async () => {
    loginAs("zhangwei") // operator team-prod
    render(
      <PermissionGuard permission="server.manage" resourceId="srv-prod-api-01">
        <button>管理按钮</button>
      </PermissionGuard>
    )
    expect(screen.getByRole("button", { name: "管理按钮" })).toBeInTheDocument()
    // 重新渲染异团队资源
    render(
      <PermissionGuard permission="server.manage" resourceId="srv-staging-web-01">
        <button>异团队按钮</button>
      </PermissionGuard>
    )
    expect(screen.queryByRole("button", { name: "异团队按钮" })).not.toBeInTheDocument()
    logout()
  })

  it("未登录时不渲染任何受保护内容", () => {
    logout()
    render(
      <PermissionGuard permission="server.view">
        <button>受保护</button>
      </PermissionGuard>
    )
    expect(screen.queryByRole("button", { name: "受保护" })).not.toBeInTheDocument()
  })
})
