import { useState } from "react"
import { toast } from "sonner"
import { KeyRound, Plus, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"

interface ApiToken {
  id: string
  name: string
  scope: string
  createdAt: string
  lastUsed: string
}

const INITIAL_TOKENS: ApiToken[] = [
  { id: "tok-01", name: "ci-deploy", scope: "server.manage, docker.manage", createdAt: "2026-07-01", lastUsed: "2 小时前" },
  { id: "tok-02", name: "monitoring-agent", scope: "metrics.view, logs.view", createdAt: "2026-06-15", lastUsed: "5 分钟前" },
]

/**
 * 安全设置 — Agent 令牌 / API Token / 会话 / 登录策略
 */
export function SecuritySettings() {
  const [tokensEnabled, setTokensEnabled] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState("30")
  const [concurrentSessions, setConcurrentSessions] = useState("2")
  const [lockoutEnabled, setLockoutEnabled] = useState(true)
  const [lockoutAttempts, setLockoutAttempts] = useState("5")
  const [apiTokens, setApiTokens] = useState<ApiToken[]>(INITIAL_TOKENS)

  const save = (label: string, description?: string) =>
    toast.success(`${label}已保存`, description ? { description } : undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>安全</CardTitle>
        <CardDescription>令牌、会话与登录策略</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent 令牌 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Agent 安装令牌
              </p>
              <p className="text-caption mt-0.5">令牌一次性使用,30 分钟过期</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tokensEnabled ? "default" : "outline"}>
                {tokensEnabled ? "已启用" : "已停用"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTokensEnabled(!tokensEnabled)
                  toast.success(tokensEnabled ? "令牌签发已停用" : "令牌签发已启用")
                }}
              >
                {tokensEnabled ? "停用" : "启用"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.success("已轮换全局签名密钥", { description: "所有活跃令牌将失效" })}
              >
                <RotateCcw />
                轮换密钥
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* 会话设置 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="ss-timeout">会话超时(分钟)</Label>
            <div className="flex items-center gap-2">
              <input
                id="ss-timeout"
                type="range"
                min={5}
                max={120}
                step={5}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="flex-1 accent-primary"
              />
              <span className="w-16 text-right font-mono text-sm">{sessionTimeout}</span>
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="ss-concurrent">并发会话限制</Label>
            <select
              id="ss-concurrent"
              value={concurrentSessions}
              onChange={(e) => setConcurrentSessions(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="1">单会话</option>
              <option value="2">2 个</option>
              <option value="5">5 个</option>
              <option value="0">不限制</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="sm:col-span-2 w-fit"
            onClick={() => save("会话设置", `超时 ${sessionTimeout} 分钟 · 并发 ${concurrentSessions === "0" ? "不限" : concurrentSessions + " 个"}`)}
          >
            保存会话设置
          </Button>
        </div>

        <Separator />

        {/* 登录策略 */}
        <div className="space-y-4">
          <p className="text-sm font-medium">登录策略</p>
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <p className="text-sm">失败锁定</p>
              <p className="text-caption">连续失败达到次数后锁定账号 15 分钟</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={3}
                max={10}
                value={lockoutAttempts}
                disabled={!lockoutEnabled}
                onChange={(e) => setLockoutAttempts(e.target.value)}
                className="h-8 w-16 rounded-md border bg-background px-2 text-center text-sm"
              />
              <span className="text-xs text-muted-foreground">次</span>
              <Toggle
                checked={lockoutEnabled}
                onChange={setLockoutEnabled}
                label="失败锁定"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => save("登录策略", `失败锁定 ${lockoutEnabled ? lockoutAttempts + " 次" : "已关闭"}`)}>
            保存登录策略
          </Button>
        </div>

        <Separator />

        {/* API Token 管理 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">API Token</p>
              <p className="text-caption">用于 CI/CD 与自动化集成的访问令牌</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setApiTokens((prev) => [
                  {
                    id: `tok-${Date.now().toString(36)}`,
                    name: "new-token",
                    scope: "自定义",
                    createdAt: "刚刚",
                    lastUsed: "从未使用",
                  },
                  ...prev,
                ])
                toast.success("API Token 已创建", { description: "请在弹窗中复制 Token(演示)" })
              }}
            >
              <Plus />
              创建 Token
            </Button>
          </div>
          <div className="divide-y rounded-md border">
            {apiTokens.map((token) => (
              <div key={token.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="font-mono text-xs font-medium">{token.name}</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {token.scope}
                </Badge>
                <span className="ml-auto flex gap-3 text-caption">
                  <span>创建于 {token.createdAt}</span>
                  <span>最近使用:{token.lastUsed}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive"
                  onClick={() => {
                    setApiTokens((prev) => prev.filter((t) => t.id !== token.id))
                    toast.success(`Token ${token.name} 已吊销`)
                  }}
                >
                  吊销
                </Button>
              </div>
            ))}
            {apiTokens.length === 0 && (
              <p className="text-caption px-3 py-4 text-center">暂无 API Token</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
