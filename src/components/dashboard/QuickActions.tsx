import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Boxes, Plus, Rocket, SquareTerminal } from "lucide-react"
import { toast } from "sonner"

import { ServerFormDialog } from "@/components/server/ServerFormDialog"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { Button } from "@/components/ui/button"
import { useServers } from "@/hooks/useServers"
import { PERMISSIONS } from "@/types/auth"

const ACTIONS = [
  {
    label: "添加服务器",
    description: "添加新服务器",
    icon: Plus,
    action: "add" as const,
    permission: PERMISSIONS.SERVER_CREATE,
  },
  {
    label: "部署应用",
    description: "部署应用到集群",
    icon: Rocket,
    action: "deploy" as const,
    permission: PERMISSIONS.SERVER_MANAGE,
  },
  {
    label: "创建容器",
    description: "创建 Docker 容器",
    icon: Boxes,
    action: "container" as const,
    permission: PERMISSIONS.DOCKER_MANAGE,
  },
  {
    label: "打开终端",
    description: "打开服务器终端",
    icon: SquareTerminal,
    action: "terminal" as const,
    permission: PERMISSIONS.TERMINAL_ACCESS,
  },
]

/**
 * 快捷操作区
 */
export function QuickActions() {
  const [addOpen, setAddOpen] = useState(false)
  const navigate = useNavigate()
  const { servers } = useServers()

  const handleAction = (action: (typeof ACTIONS)[number]["action"]) => {
    switch (action) {
      case "add":
        setAddOpen(true)
        break
      case "deploy":
        toast.success("部署请求已提交", {
          description: "正在为集群创建部署任务(mock)",
        })
        break
      case "container":
        toast.success("容器创建请求已提交", {
          description: "将使用默认策略创建容器(mock)",
        })
        break
      case "terminal": {
        const target = servers.find((s) => s.status === "online")
        if (target) {
          navigate(`/servers/${target.id}?tab=terminal`)
        } else {
          toast.error("没有在线服务器")
        }
        break
      }
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((item) => (
          <PermissionGuard key={item.label} permission={item.permission}>
            <Button
              variant="outline"
              className="flex h-auto w-full flex-col items-start gap-1.5 p-3.5 shadow-none transition-all hover:-translate-y-0.5 hover:shadow-soft-sm"
              onClick={() => handleAction(item.action)}
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-caption text-left">{item.description}</span>
            </Button>
          </PermissionGuard>
        ))}
      </div>

      <ServerFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) =>
          toast.success("服务器已添加", {
            description: `${data.name} · ${data.ip}(可在 Servers 页管理)`,
          })
        }
      />
    </>
  )
}
