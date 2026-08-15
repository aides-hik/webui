import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ACTION_LABELS, type AuditLog } from "@/types/audit"

interface AuditTableProps {
  logs: AuditLog[]
  onView: (log: AuditLog) => void
}

/**
 * 审计日志表格(分页数据)
 */
export function AuditTable({ logs, onView }: AuditTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>时间</TableHead>
            <TableHead>用户</TableHead>
            <TableHead>操作</TableHead>
            <TableHead>资源</TableHead>
            <TableHead>服务器</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>IP</TableHead>
            <TableHead className="w-16 text-right">详情</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                暂无匹配的审计记录
              </TableCell>
            </TableRow>
          )}
          {logs.map((log) => (
            <TableRow
              key={log.id}
              className="cursor-pointer"
              onClick={() => onView(log)}
            >
              <TableCell>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </TableCell>
              <TableCell className="text-xs font-medium">{log.username}</TableCell>
              <TableCell className="whitespace-nowrap text-xs">
                {ACTION_LABELS[log.action]}
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {log.resourceType}:{log.resourceId}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {log.serverId ?? "—"}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge
                  tone={log.status === "success" ? "success" : "danger"}
                  label={log.status === "success" ? "成功" : "失败"}
                  size="2xs"
                  showDot={false}
                />
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">{log.ip}</span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(log)
                  }}
                  aria-label="查看详情"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
