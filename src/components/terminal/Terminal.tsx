import { useEffect, useRef, useState } from "react"
import { Terminal as XTerm } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { Maximize, Minimize, RotateCcw, TerminalSquare, Trash2 } from "lucide-react"

import { useTerminal } from "@/hooks/useTerminal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import "@xterm/xterm/css/xterm.css"

/** 深色 DevOps 终端主题(与设计系统协调) */
const TERMINAL_THEME = {
  background: "#0a0f1a",
  foreground: "#d4e0f0",
  cursor: "#7dd3fc",
  cursorAccent: "#0a0f1a",
  selectionBackground: "rgba(125, 211, 252, 0.25)",
  black: "#0a0f1a",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#d4e0f0",
  brightBlack: "#64748b",
  brightRed: "#fca5a5",
  brightGreen: "#86efac",
  brightYellow: "#fde047",
  brightBlue: "#93c5fd",
  brightMagenta: "#d8b4fe",
  brightCyan: "#67e8f9",
  brightWhite: "#f8fafc",
}

interface TerminalProps {
  serverId: string
  serverName: string
  /** 多会话场景由外部指定;缺省自动生成 */
  sessionId?: string
  /** 输出区高度(px);全屏时忽略 */
  height?: number
  className?: string
}

/**
 * Web 终端(xterm.js)
 * ------------------------------------------------------------
 * 架构:浏览器(xterm.js) → WebSocket → Terminal Gateway → SSH/Agent
 * - FitAddon 自适应尺寸 / WebLinksAddon 链接识别
 * - 本地回显 + 服务端输出经 useTerminal 双向通道
 * - 全屏 / 清屏 / 重连
 */
export function Terminal({
  serverId,
  serverName,
  sessionId,
  height = 380,
  className,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const terminal = useTerminal({ serverId, sessionId })

  /* 初始化 xterm 实例 */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const term = new XTerm({
      theme: TERMINAL_THEME,
      fontFamily:
        '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 2000,
      allowProposedApi: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    term.open(container)
    fit.fit()

    termRef.current = term
    fitRef.current = fit
    terminal.attach(term, fit)

    /* 输入 → 本地回显 + 协议发送 */
    term.onData((data) => {
      term.write(data)
      terminal.sendCommand(data)
    })

    /* 窗口尺寸变化 → 协议通知(真实场景透传 PTY) */
    term.onResize(({ cols, rows }) => {
      terminal.resize(cols, rows)
    })

    return () => {
      termRef.current = null
      fitRef.current = null
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, sessionId])

  /* 全屏切换 / 容器可见性变化后重新适配 */
  useEffect(() => {
    const t = requestAnimationFrame(() => fitRef.current?.fit())
    return () => cancelAnimationFrame(t)
  }, [fullscreen])

  const handleReconnect = () => {
    terminal.disconnect()
    terminal.connect()
    requestAnimationFrame(() => fitRef.current?.fit())
  }

  const sessionLabel = terminal.sessionId?.slice(-4) ?? "—"

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-[#0a0f1a] shadow-soft-sm",
        fullscreen && "fixed inset-0 z-50 rounded-none border-0",
        className
      )}
    >
      {/* 标题栏 */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-3 py-1.5">
        <TerminalSquare className="h-3.5 w-3.5 text-green-400" />
        <span className="font-mono text-xs text-foreground/90">
          {serverName}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          #{sessionLabel}
        </span>

        <span className="ml-1 inline-flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              terminal.status === "connected"
                ? "bg-success"
                : "bg-destructive animate-pulse"
            )}
            aria-hidden
          />
          <span className="text-[10px] text-muted-foreground">
            {terminal.status === "connected" ? "已连接" : "已断开"}
          </span>
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-muted-foreground"
            onClick={() => termRef.current?.clear()}
            title="清屏"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-muted-foreground"
            onClick={handleReconnect}
            title="重连"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-muted-foreground"
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "退出全屏" : "全屏"}
          >
            {fullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* 终端渲染区 */}
      <div
        ref={containerRef}
        className="w-full p-2"
        style={fullscreen ? { flex: 1 } : { height }}
      />
    </div>
  )
}
