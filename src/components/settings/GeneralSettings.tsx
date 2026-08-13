import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/components/common/theme-provider"

const THEMES = [
  { value: "light", label: "亮色" },
  { value: "dark", label: "暗色" },
  { value: "system", label: "跟随系统" },
] as const

/**
 * 常规设置 — 平台名称 / 主题(真实生效)
 */
export function GeneralSettings() {
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState("CloudPanel")

  return (
    <Card>
      <CardHeader>
        <CardTitle>常规</CardTitle>
        <CardDescription>平台名称与外观偏好</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="gs-name">平台名称</Label>
          <div className="flex max-w-md gap-2">
            <Input
              id="gs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => toast.success("平台名称已保存", { description: name })}
            >
              保存
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>主题</Label>
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <Button
                key={t.value}
                variant={theme === t.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => setTheme(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <p className="text-caption">主题选择即时生效并持久化保存</p>
        </div>
      </CardContent>
    </Card>
  )
}
