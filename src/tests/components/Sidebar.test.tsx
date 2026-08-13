import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { Sidebar } from "@/components/layout/Sidebar"
import { mockUsers } from "@/services/mockAuth"
import { useAuthStore } from "@/stores/authStore"

function renderSidebar(username: string) {
  const user = mockUsers.find((u) => u.username === username)!
  useAuthStore.setState({
    user: { ...user, roles: [...user.roles] },
    token: "test-token",
  })
  return render(
    <MemoryRouter>
      <Sidebar collapsed={false} mobileOpen={false} onToggleCollapsed={() => {}} onCloseMobile={() => {}} />
    </MemoryRouter>
  )
}

function logout() {
  useAuthStore.setState({ user: null, token: null })
}

function expectMenuVisible(labels: string[]) {
  for (const label of labels) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0)
  }
}

describe("Sidebar — 角色菜单过滤", () => {
  it("Admin 看到全部菜单", () => {
    renderSidebar("admin")
    expectMenuVisible(["仪表盘", "服务器", "应用", "容器", "指标", "日志", "用户", "团队", "角色", "服务器访问", "设置", "审计日志"])
    logout()
  })

  it("Operator 隐藏管理菜单,保留审计", () => {
    renderSidebar("zhangwei")
    expectMenuVisible(["服务器", "容器", "审计日志"])
    for (const hidden of ["用户", "团队", "角色", "服务器访问", "设置"]) {
      expect(screen.queryByText(hidden)).not.toBeInTheDocument()
    }
    logout()
  })

  it("Viewer 仅基础菜单(隐藏容器/管理/审计)", () => {
    renderSidebar("chenyu")
    expectMenuVisible(["仪表盘", "服务器", "指标", "日志"])
    for (const hidden of ["容器", "用户", "团队", "角色", "服务器访问", "设置", "审计日志"]) {
      expect(screen.queryByText(hidden)).not.toBeInTheDocument()
    }
    logout()
  })

  it("未登录时显示 guest 用户信息", () => {
    logout()
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} mobileOpen={false} onToggleCollapsed={() => {}} onCloseMobile={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getAllByText("未登录").length).toBeGreaterThan(0)
  })
})
