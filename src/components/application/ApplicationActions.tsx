import { Play, RotateCcw, Square, ScrollText } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { Button } from "@/components/ui/button"
import { PERMISSIONS } from "@/types/auth"
import type { Application, ApplicationAction } from "@/types/application"

const ACTION_LABEL: Record<ApplicationAction, string> = {
  start: "启动",
  stop: "停止",
  restart: "重启",
}

interface ApplicationActionsProps {
  application: Application
  /** 状态变更回调(页面本地管理) */
  onStatusChange?: (app: Application, action: ApplicationAction) => void
}

/**
 * 应用操作 — 启动 / 停止 / 重启 / 查看日志
 * 操作经 Agent 下发(mock),未来对接 POST /api/applications/:id/action
 */
export function ApplicationActions({ application, onStatusChange }: ApplicationActionsProps) {
  const running = application.status === "running"

  const act = (action: ApplicationAction) => {
    onStatusChange?.(application, action)
    toast.success(`${application.name} 已${ACTION_LABEL[action]}`, {
      description: `操作经 Agent 下发(mock)`,
    })
  }

  return (
    <div className="flex justify-end gap-1">
      <PermissionGuard permission={PERMISSIONS.SERVER_MANAGE}>
        {running ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => act("stop")}
          >
            <Square />
            停止
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-success"
            onClick={() => act("start")}
          >
            <Play />
            启动
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => act("restart")}
        >
          <RotateCcw />
          重启
        </Button>
      </PermissionGuard>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() =>
          toast.success(`正在打开 ${application.name} 日志`, {
            description: "跳转日志视图(mock)",
          })
        }
      >
        <ScrollText />
        日志
      </Button>
    </div>
  )
}
