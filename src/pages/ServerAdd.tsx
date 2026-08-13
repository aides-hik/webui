import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Check, ClipboardCopy, Server, TerminalSquare } from "lucide-react"
import { toast } from "sonner"

import { AgentStatus } from "@/components/server/AgentStatus"
import { PageContainer } from "@/components/common/PageContainer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { serverApi } from "@/api/server"
import { useServerStore } from "@/stores/serverStore"
import { cn } from "@/lib/utils"
import type { AgentToken } from "@/types/agent"
import type { NewServerInput } from "@/types/server"

const STEPS = ["服务器信息", "安装 Agent", "完成"]

const EMPTY_FORM: NewServerInput = {
  name: "",
  ip: "",
  region: "ap-east-1",
  os: "Ubuntu 22.04 LTS",
  cores: 4,
  ram: "16 GB",
}

/**
 * 添加服务器 — 三步注册流程
 * 1. 填写服务器信息 → 2. 生成安装令牌与命令 → 3. Agent 注册后显示在线
 */
export function ServerAdd() {
  const navigate = useNavigate()
  const addServer = useServerStore((s) => s.addServer)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<NewServerInput>(EMPTY_FORM)
  const [serverId, setServerId] = useState<string | null>(null)
  const [token, setToken] = useState<AgentToken | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [registering, setRegistering] = useState(false)

  const set = <K extends keyof NewServerInput>(key: K, value: NewServerInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  /* 步骤 1 → 2:创建服务器并生成 Agent 令牌 */
  const handleCreate = async () => {
    if (!form.name.trim() || !form.ip.trim()) {
      toast.error("请填写服务器名称与 IP 地址")
      return
    }
    setSubmitting(true)
    try {
      const server = await addServer(form)
      const agentToken = await serverApi.createAgentToken(server.id)
      setServerId(server.id)
      setToken(agentToken)
      setStep(1)
    } catch (err) {
      toast.error("创建失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    } finally {
      setSubmitting(false)
    }
  }

  /* 步骤 2 → 3:模拟 Agent 完成安装并注册(真实场景由 Agent 调用) */
  const handleRegister = async () => {
    if (!token) return
    setRegistering(true)
    try {
      await serverApi.registerAgent(token.token)
      toast.success("Agent 注册成功", { description: "服务器已上线" })
      setStep(2)
    } catch (err) {
      toast.error("注册失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    } finally {
      setRegistering(false)
    }
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label}已复制`)
  }

  return (
    <PageContainer size="narrow" className="py-2">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
          <Link to="/servers">
            <ArrowLeft />
            返回
          </Link>
        </Button>
        <div>
          <h2 className="text-title text-xl">添加服务器</h2>
          <p className="text-caption mt-0.5">通过 Agent 接入新的 Linux 服务器</p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                i < step
                  ? "bg-success text-success-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                i === step ? "font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <Separator className="w-8" />}
          </li>
        ))}
      </ol>

      {/* 步骤 1:服务器信息 */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4 text-muted-foreground" />
              服务器信息
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sa-name">名称</Label>
              <Input
                id="sa-name"
                placeholder="prod-web-02"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-ip">IP 地址</Label>
              <Input
                id="sa-ip"
                placeholder="172.16.1.12"
                className="font-mono"
                value={form.ip}
                onChange={(e) => set("ip", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-region">区域</Label>
              <Input
                id="sa-region"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-os">操作系统</Label>
              <Input
                id="sa-os"
                value={form.os}
                onChange={(e) => set("os", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-cores">CPU 核心</Label>
              <Input
                id="sa-cores"
                type="number"
                min={1}
                value={form.cores}
                onChange={(e) => set("cores", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-ram">内存</Label>
              <Input
                id="sa-ram"
                value={form.ram}
                onChange={(e) => set("ram", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={handleCreate} disabled={submitting} className="w-full sm:w-auto">
                {submitting ? "创建中…" : "下一步:生成安装令牌"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤 2:安装 Agent */}
      {step === 1 && token && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TerminalSquare className="h-4 w-4 text-muted-foreground" />
                在服务器上执行安装命令
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-body-sm mb-2">
                  复制以下命令,SSH 登录 <span className="font-medium">{form.name}</span> 后执行。
                  令牌 <span className="font-medium">30 分钟内有效</span>,仅可使用一次。
                </p>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                  <code className="min-w-0 flex-1 break-all font-mono text-xs">
                    {token.installCommand}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2"
                    onClick={() => copy(token.installCommand, "安装命令")}
                  >
                    <ClipboardCopy />
                    复制
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-body-sm mb-2">
                  安装完成后 Agent 将自动使用令牌注册。
                  也可以在此模拟 Agent 完成安装:
                </p>
                <Button onClick={handleRegister} disabled={registering}>
                  {registering ? "注册中…" : "模拟 Agent 完成安装"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {serverId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">接入状态</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentStatus serverId={serverId} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 步骤 3:完成 */}
      {step === 2 && serverId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4" />
              服务器已接入
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AgentStatus serverId={serverId} showInstallHint={false} />
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/servers/${serverId}`)}>查看服务器</Button>
              <Button variant="outline" onClick={() => navigate("/servers")}>
                返回列表
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
