import { useNavigate } from "react-router-dom"

import { ApplicationActions } from "@/components/application/ApplicationActions"
import { ApplicationStatus } from "@/components/application/ApplicationStatus"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Application, ApplicationAction } from "@/types/application"

interface ApplicationTableProps {
  applications: Application[]
  onStatusChange?: (app: Application, action: ApplicationAction) => void
}

/**
 * 应用列表表格
 */
export function ApplicationTable({ applications, onStatusChange }: ApplicationTableProps) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>应用名称</TableHead>
          <TableHead>服务器</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>版本</TableHead>
          <TableHead>端口</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead className="w-44 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((app) => (
          <TableRow key={app.id} className="cursor-pointer" onClick={() => navigate(`/servers/${app.serverId}`)}>
            <TableCell className="font-medium">{app.name}</TableCell>
            <TableCell>
              <span className="text-xs text-muted-foreground">{app.serverName}</span>
            </TableCell>
            <TableCell>
              <ApplicationStatus status={app.status} />
            </TableCell>
            <TableCell>
              <span className="font-mono text-xs text-muted-foreground">{app.version}</span>
            </TableCell>
            <TableCell>
              {app.port ? (
                <span className="font-mono text-xs text-muted-foreground">{app.port}</span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-xs text-muted-foreground">{app.updatedAt}</span>
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <ApplicationActions application={app} onStatusChange={onStatusChange} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
      </div>
      )
      }
