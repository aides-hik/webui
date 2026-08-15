import { fireEvent, render, screen } from "@testing-library/react"

import { TerminalTabs } from "@/components/terminal/TerminalTabs"

/* Terminal 依赖 xterm.js,在 jsdom 中渲染受限;
   本测试聚焦 TerminalTabs 的会话状态机,故将其桩替换 */
vi.mock("@/components/terminal/Terminal", () => ({
  Terminal: ({ serverId, sessionId }: { serverId: string; sessionId?: string }) => (
    <div data-testid="terminal" data-server-id={serverId} data-session-id={sessionId ?? ""} />
  ),
}))

/* 会话按 serverId 做模块级缓存,每个用例用独立 id 保证互不干扰 */
let testSeq = 0
function renderTabs() {
  testSeq += 1
  render(<TerminalTabs serverId={`srv-test-${testSeq}`} serverName="t" />)
}

describe("TerminalTabs — 会话关闭状态机", () => {
  it("关闭最后一个会话:不崩溃,标签与终端均消失", () => {
    renderTabs()

    expect(screen.getAllByRole("tab")).toHaveLength(1)
    expect(screen.getByTestId("terminal")).toBeInTheDocument()

    // 关闭唯一(也是最后一个)会话 —— 曾触发
    // TypeError: Cannot read properties of undefined (reading 'id')
    fireEvent.click(screen.getByRole("button", { name: /关闭终端/ }))

    expect(screen.queryAllByRole("tab")).toHaveLength(0)
    expect(screen.queryByTestId("terminal")).not.toBeInTheDocument()
  })

  it("关闭激活会话后,自动切换到剩余最后一个会话", () => {
    renderTabs()

    // 新增第二个会话
    fireEvent.click(screen.getByRole("button", { name: /新建/ }))
    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(2)
    expect(tabs[1]).toHaveAttribute("aria-selected", "true")

    // 关闭激活的(最后一个)会话 → 应回落到剩余会话
    const closeButtons = screen.getAllByRole("button", { name: /关闭终端/ })
    fireEvent.click(closeButtons[closeButtons.length - 1])

    const remaining = screen.getAllByRole("tab")
    expect(remaining).toHaveLength(1)
    expect(remaining[0]).toHaveAttribute("aria-selected", "true")
    expect(screen.getByTestId("terminal")).toHaveAttribute(
      "data-session-id",
      expect.stringMatching(/^sess-/)
    )
  })

  it("关闭非激活会话:激活态保持不变", () => {
    renderTabs()

    fireEvent.click(screen.getByRole("button", { name: /新建/ }))
    const firstTab = screen.getAllByRole("tab")[0]
    fireEvent.click(firstTab) // 切回第一个会话
    expect(firstTab).toHaveAttribute("aria-selected", "true")

    // 关闭非激活的(最后一个)会话 → 第一个会话仍为激活
    const closeButtons = screen.getAllByRole("button", { name: /关闭终端/ })
    fireEvent.click(closeButtons[closeButtons.length - 1])

    expect(screen.getAllByRole("tab")).toHaveLength(1)
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true")
  })

  it("关闭全部会话后新建:编号从 1 重新开始,不累计", () => {
    renderTabs()

    // 初始为「终端 1」
    expect(screen.getByRole("tab", { name: /终端 1/ })).toBeInTheDocument()

    // 关闭唯一会话
    fireEvent.click(screen.getByRole("button", { name: /关闭终端/ }))
    expect(screen.queryAllByRole("tab")).toHaveLength(0)

    // 新建 → 应复用编号 1(曾因模块级计数器导致变成「终端 2」并持续累加)
    fireEvent.click(screen.getByRole("button", { name: /新建/ }))
    expect(screen.getByRole("tab", { name: /终端 1/ })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /终端 2/ })).not.toBeInTheDocument()
  })

  it("存在空闲编号时新建:复用最小空闲编号", () => {
    renderTabs() // 终端 1
    fireEvent.click(screen.getByRole("button", { name: /新建/ })) // 终端 2
    expect(screen.getByRole("tab", { name: /终端 2/ })).toBeInTheDocument()

    // 关闭终端 1 → 只剩终端 2,编号 1 被释放
    fireEvent.click(screen.getByRole("button", { name: /关闭终端 1/ }))
    expect(screen.queryByRole("tab", { name: /终端 1/ })).not.toBeInTheDocument()

    // 新建 → 复用最小空闲编号 1,而不是变成终端 3
    fireEvent.click(screen.getByRole("button", { name: /新建/ }))
    expect(screen.getByRole("tab", { name: /终端 1/ })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /终端 3/ })).not.toBeInTheDocument()
  })
})

describe("TerminalTabs — 会话跨导航保持", () => {
  const NAV_SERVER = "srv-nav-persist"

  it("新建多个会话后卸载再挂载:会话保持不变", () => {
    const { unmount } = render(
      <TerminalTabs serverId={NAV_SERVER} serverName="nav" />
    )

    // 新建第二个会话 → 共 2 个
    fireEvent.click(screen.getByRole("button", { name: /新建/ }))
    expect(screen.getAllByRole("tab")).toHaveLength(2)

    // 模拟导航离开(路由切换 → 组件卸载)
    unmount()

    // 模拟返回终端页(组件重新挂载)
    render(<TerminalTabs serverId={NAV_SERVER} serverName="nav" />)

    // 曾因本地 state 随卸载销毁,返回后只剩 1 个会话
    expect(screen.getAllByRole("tab")).toHaveLength(2)
    expect(screen.getByRole("tab", { name: /终端 1/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /终端 2/ })).toBeInTheDocument()
  })

  it("关闭全部会话后离开再返回:重新创建初始终端 1", () => {
    const { unmount } = render(
      <TerminalTabs serverId={`${NAV_SERVER}-b`} serverName="nav" />
    )

    fireEvent.click(screen.getByRole("button", { name: /关闭终端/ }))
    expect(screen.queryAllByRole("tab")).toHaveLength(0)

    unmount()
    render(<TerminalTabs serverId={`${NAV_SERVER}-b`} serverName="nav" />)

    expect(screen.getByRole("tab", { name: /终端 1/ })).toBeInTheDocument()
  })

  it("不同服务器互不影响:各自的会话独立保存", () => {
    const a = `${NAV_SERVER}-c1`
    const b = `${NAV_SERVER}-c2`

    const { unmount: unmountA } = render(<TerminalTabs serverId={a} serverName="a" />)
    fireEvent.click(screen.getByRole("button", { name: /新建/ }))
    expect(screen.getAllByRole("tab")).toHaveLength(2)
    unmountA()

    // 另一台服务器:独立会话,只有初始 1 个
    const { unmount: unmountB } = render(<TerminalTabs serverId={b} serverName="b" />)
    expect(screen.getAllByRole("tab")).toHaveLength(1)
    unmountB()

    // 返回服务器 a:仍是 2 个(会话按 serverId 独立缓存)
    render(<TerminalTabs serverId={a} serverName="a" />)
    expect(screen.getAllByRole("tab")).toHaveLength(2)
  })
})
