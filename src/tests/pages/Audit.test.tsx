import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { Audit } from "@/pages/Audit"
import { mockUsers } from "@/services/mockAuth"
import { auditLogs } from "@/services/mockAudit"
import { useAuthStore } from "@/stores/authStore"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function loginAs(username: string) {
  const user = mockUsers.find((u) => u.username === username)!
  useAuthStore.setState({
    user: { ...user, roles: [...user.roles] },
    token: "test-token",
  })
}

function renderAudit(username: string, initialEntry = "/audit") {
  loginAs(username)
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/audit" element={<Audit />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return utils
}

describe("Audit — 数据范围(RBAC)", () => {
  it("Admin 可见全部审计记录", async () => {
    renderAudit("admin")
    await waitFor(() => {
      expect(screen.getByText("审计日志")).toBeInTheDocument()
    })
    // 统计卡渲染
    await waitFor(() => {
      expect(screen.getByText("今日事件")).toBeInTheDocument()
    })
    // 等待分页数据加载后,全部记录条数等于审计总量
    await waitFor(() => {
      const totalText = screen.getByText(/条匹配/)
      const total = Number(totalText.textContent?.match(/\d+/)?.[0] ?? 0)
      expect(total).toBe(auditLogs.length)
    })
  })

  it("Operator 仅显示本人操作(数据范围过滤)", async () => {
    renderAudit("zhangwei")
    await waitFor(() => {
      expect(screen.getByText(/仅显示本人操作/)).toBeInTheDocument()
    })
    const myCount = auditLogs.filter((l) => l.username === "zhangwei").length
    await waitFor(() => {
      const totalText = screen.getByText(/条匹配/)
      const total = Number(totalText.textContent?.match(/\d+/)?.[0] ?? -1)
      expect(total).toBe(myCount)
    })
  })

  it("筛选状态持久化到 URL(page/status 参数)", async () => {
    renderAudit("admin", "/audit?page=2&status=failed")
    await waitFor(() => {
      expect(screen.getByText("审计日志")).toBeInTheDocument()
    })
    // 分页栏显示第 2 页
    expect(screen.getByText(/第 2 \//)).toBeInTheDocument()
  })

  it("导出按钮存在(CSV/JSON 入口)", async () => {
    renderAudit("admin")
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "导出" })).toBeInTheDocument()
    })
  })
})
