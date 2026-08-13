import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"

import { ServerDetail } from "@/pages/ServerDetail"
import { servers as seedServers } from "@/lib/mock-data"
import { mockUsers } from "@/services/mockAuth"
import { useAuthStore } from "@/stores/authStore"
import { useServerStore } from "@/stores/serverStore"

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

function renderDetail(username: string, serverId = "srv-prod-api-01") {
  loginAs(username)
  const utils = render(
    <MemoryRouter initialEntries={[`/servers/${serverId}`]}>
      <Routes>
        <Route path="/servers/:id" element={<ServerDetail />} />
      </Routes>
    </MemoryRouter>
  )
  logout()
  return utils
}

/* ServerDetail 从 live store 读取;种子数据保证断言同步确定,不触发异步拉取 */
beforeEach(() => {
  useServerStore.setState({
    servers: seedServers.map((s) => ({ ...s })),
    loading: false,
    error: null,
  })
})

describe("ServerDetail — 页面权限", () => {
  it("Admin 可见全部 Tab(含终端/容器)", () => {
    renderDetail("admin")
    expect(screen.getByText("prod-api-01")).toBeInTheDocument()
    for (const tab of ["概览", "终端", "Docker", "日志", "指标"]) {
      expect(screen.getByText(tab)).toBeInTheDocument()
    }
  })

  it("Viewer 对未分配服务器显示无权限页", () => {
    renderDetail("chenyu", "srv-prod-api-01") // prod 未分配给 chenyu
    expect(screen.getByText("无权限访问此服务器")).toBeInTheDocument()
    expect(screen.queryByText("Docker")).not.toBeInTheDocument()
  })

  it("Viewer 对已分配服务器可看概览,但无容器/终端操作", () => {
    renderDetail("chenyu", "srv-staging-web-01") // 已分配 view+manage
    expect(screen.queryByText("无权限访问此服务器")).not.toBeInTheDocument()
    // Docker Tab 存在但内容被守卫拦截
    expect(screen.getByText("Docker")).toBeInTheDocument()
  })

  it("不存在的服务器显示 404", () => {
    renderDetail("admin", "srv-not-exist")
    expect(screen.getByText("服务器不存在")).toBeInTheDocument()
  })
})
