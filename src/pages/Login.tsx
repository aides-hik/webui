import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Boxes, KeyRound, Loader2, ShieldCheck, Wrench, Eye } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/authStore"

const DEMO_ACCOUNTS = [
  {
    username: "admin",
    label: "管理员",
    description: "全部权限",
    icon: ShieldCheck,
  },
  {
    username: "zhangwei",
    label: "运维",
    description: "运维操作(无删除/用户管理)",
    icon: Wrench,
  },
  {
    username: "chenyu",
    label: "只读",
    description: "仅查看(无终端/修改)",
    icon: Eye,
  },
]

/**
 * 登录页 — 表单登录 + 演示账号快捷登录
 */
export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const login = useAuthStore((s) => s.login)
  const loginAs = useAuthStore((s) => s.loginAs)

  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard"

  if (user) {
    return <Navigate to={from} replace />
  }

  const handleLogin = async (u: string, p: string) => {
    setLoading(true)
    try {
      await login(u, p)
      toast.success(`欢迎回来,${u}`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error("登录失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async (demoUsername: string) => {
    setLoading(true)
    try {
      await loginAs(demoUsername)
      toast.success(`已以 ${demoUsername} 身份登录`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error("登录失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="bg-gradient-brand flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft">
            <Boxes className="h-6 w-6 text-primary-foreground" />
          </span>
          <h1 className="text-title">CloudPanel</h1>
          <p className="text-body-sm">服务器管理平台</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* 表单登录 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                账号登录
              </CardTitle>
              <CardDescription>演示密码:admin 账号为 admin123,其余为 123456</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-user">用户名</Label>
                <Input
                  id="login-user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pass">密码</Label>
                <Input
                  id="login-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(username, password)}
                  autoComplete="current-password"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => handleLogin(username, password)}
                disabled={loading || !username || !password}
              >
                {loading && <Loader2 className="animate-spin" />}
                登 录
              </Button>
            </CardContent>
          </Card>

          {/* 演示账号 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">演示账号</CardTitle>
              <CardDescription>点击以对应角色身份体验权限控制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.username}
                  variant="outline"
                  className="flex h-auto w-full items-center justify-start gap-3 p-3 shadow-none"
                  onClick={() => handleDemo(account.username)}
                  disabled={loading}
                >
                  <account.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">{account.label}</span>
                    <span className="text-caption block">{account.description}</span>
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {account.username}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
