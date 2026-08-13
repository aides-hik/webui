/* ============================================================
   审计日志模型
   ------------------------------------------------------------
   记录平台关键操作:登录 / 服务器 CRUD / Docker / 终端 /
   权限变化 / 配置修改。真实场景由服务端写入审计存储,
   前端消费查询接口;当前由 mockAudit 提供。
   ============================================================ */

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.login_failed"
  | "user.create"
  | "user.update"
  | "user.disable"
  | "user.role_change"
  | "server.create"
  | "server.delete"
  | "server.update"
  | "server.restart"
  | "container.start"
  | "container.stop"
  | "container.restart"
  | "terminal.open"
  | "terminal.command"
  | "settings.update"

export type AuditStatus = "success" | "failed"

export interface AuditLog {
  id: string
  userId: string
  username: string
  action: AuditAction
  resourceType: string // server | user | container | terminal | console | settings
  resourceId: string
  serverId?: string
  status: AuditStatus
  ip: string
  userAgent: string
  createdAt: string // ISO
  metadata?: Record<string, unknown>
}

/** 新增审计记录入参(ip / userAgent / createdAt 由服务端补充) */
export interface AuditInput {
  userId: string
  username: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  serverId?: string
  status?: AuditStatus
  metadata?: Record<string, unknown>
}

/** 操作类型中文标签 */
export const ACTION_LABELS: Record<AuditAction, string> = {
  "auth.login": "用户登录",
  "auth.logout": "退出登录",
  "auth.login_failed": "登录失败",
  "user.create": "创建用户",
  "user.update": "更新用户",
  "user.disable": "禁用用户",
  "user.role_change": "角色变更",
  "server.create": "添加服务器",
  "server.delete": "删除服务器",
  "server.update": "更新服务器",
  "server.restart": "重启服务器",
  "container.start": "启动容器",
  "container.stop": "停止容器",
  "container.restart": "重启容器",
  "terminal.open": "打开终端",
  "terminal.command": "执行命令",
  "settings.update": "修改设置",
}
