import { Link } from "react-router-dom"
import { ShieldX } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * 403 无权限页面
 */
export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold">403 · 无权限访问</h1>
        <p className="text-body-sm mt-2 max-w-sm">
          当前账号没有访问此功能的权限。如需开通,请联系管理员调整角色。
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/dashboard">返回仪表盘</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">切换账号</Link>
        </Button>
      </div>
    </div>
  )
}
