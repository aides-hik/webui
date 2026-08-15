import { useState } from "react"
import { toast } from "sonner"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"

/**
 * 通知设置 — 邮件通知 / 告警阈值
 */
export function NotificationSettings() {
  const [email, setEmail] = useState("ops@cloudpanel.dev")
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [alerts, setAlerts] = useState({
    cpu: true,
    memory: true,
    disk: true,
    offline: true,
  })
  const [cpuThreshold, setCpuThreshold] = useState("85")
  const [memThreshold, setMemThreshold] = useState("90")
  const [diskThreshold, setDiskThreshold] = useState("80")

  const save = () => {
    toast.success("通知设置已保存", {
      description: `告警邮件将发送至 ${email}`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          通知
        </CardTitle>
        <CardDescription>邮件通知与告警阈值</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 邮件 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ns-email">告警邮箱</Label>
            <Toggle checked={emailEnabled} onChange={setEmailEnabled} label="启用邮件通知" />
          </div>
          <div className="flex max-w-md gap-2">
            <Input
              id="ns-email"
              type="email"
              value={email}
              disabled={!emailEnabled}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* 告警设置 */}
        <div className="space-y-4">
          <p className="text-sm font-medium">告警规则</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "cpu" as const, label: "CPU 使用率超过阈值", value: cpuThreshold, set: setCpuThreshold },
              { key: "memory" as const, label: "内存使用率超过阈值", value: memThreshold, set: setMemThreshold },
              { key: "disk" as const, label: "磁盘使用率超过阈值", value: diskThreshold, set: setDiskThreshold },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <Toggle
                  checked={alerts[item.key]}
                  onChange={(v) => setAlerts((a) => ({ ...a, [item.key]: v }))}
                  label={item.label}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {item.label}
                </span>
                <div className="flex w-20 shrink-0 items-center gap-1">
                  <Input
                    type="number"
                    value={item.value}
                    disabled={!alerts[item.key]}
                    onChange={(e) => item.set(e.target.value)}
                    className="h-7 px-2 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <Toggle
                checked={alerts.offline}
                onChange={(v) => setAlerts((a) => ({ ...a, offline: v }))}
                label="服务器离线通知"
              />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                服务器离线通知
              </span>
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                即时
              </span>
            </div>
          </div>
        </div>

        <Button onClick={save}>保存通知设置</Button>
      </CardContent>
    </Card>
  )
}
