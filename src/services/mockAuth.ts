/* ============================================================
   Mock 认证服务
   ------------------------------------------------------------
   模拟:用户 / 角色 / 权限 / 登录 / 审计记录
   未来替换为真实后端:POST /api/auth/login 等,接口签名不变。
   ============================================================ */

import { PERMISSIONS, type LoginResult, type Permission, type Role, type User } from "@/types/auth"

/* ---------- 权限目录 ---------- */

export const permissionCatalog: Permission[] = [
  { id: PERMISSIONS.SERVER_VIEW, name: "查看服务器", description: "查看服务器列表与状态" },
  { id: PERMISSIONS.SERVER_CREATE, name: "创建服务器", description: "添加新服务器" },
  { id: PERMISSIONS.SERVER_DELETE, name: "删除服务器", description: "删除服务器资源" },
  { id: PERMISSIONS.SERVER_MANAGE, name: "管理服务器", description: "重启/编辑等运维操作" },
  { id: PERMISSIONS.TERMINAL_ACCESS, name: "终端访问", description: "打开 Web 终端执行命令" },
  { id: PERMISSIONS.DOCKER_VIEW, name: "查看容器", description: "查看 Docker 容器与镜像" },
  { id: PERMISSIONS.DOCKER_MANAGE, name: "管理容器", description: "启停/重启容器" },
  { id: PERMISSIONS.LOGS_VIEW, name: "查看日志", description: "查看平台与应用日志" },
  { id: PERMISSIONS.METRICS_VIEW, name: "查看指标", description: "查看监控指标" },
  { id: PERMISSIONS.USER_MANAGE, name: "用户管理", description: "创建/编辑/禁用用户与角色" },
  { id: PERMISSIONS.SETTINGS_MANAGE, name: "设置管理", description: "修改平台设置" },
  { id: PERMISSIONS.AUDIT_VIEW, name: "查看审计", description: "查看审计日志(运维仅限本人)" },
]

/* ---------- 默认角色 ---------- */

export const roles: Role[] = [
  {
    id: "role-admin",
    name: "admin",
    label: "管理员",
    description: "全部权限",
    scope: "all",
    permissions: permissionCatalog.map((p) => p.id),
  },
  {
    id: "role-operator",
    name: "operator",
    label: "运维",
    description: "运维操作权限(禁止删除服务器与管理用户)",
    scope: "team",
    permissions: [
      PERMISSIONS.SERVER_VIEW,
      PERMISSIONS.SERVER_MANAGE,
      PERMISSIONS.TERMINAL_ACCESS,
      PERMISSIONS.DOCKER_MANAGE,
      PERMISSIONS.LOGS_VIEW,
      PERMISSIONS.AUDIT_VIEW,
    ],
  },
  {
    id: "role-viewer",
    name: "viewer",
    label: "只读",
    description: "只读权限(禁止执行命令与修改配置)",
    scope: "assigned",
    permissions: [
      PERMISSIONS.SERVER_VIEW,
      PERMISSIONS.METRICS_VIEW,
      PERMISSIONS.LOGS_VIEW,
    ],
  },
]

const roleById = (id: string): Role => {
  const role = roles.find((r) => r.id === id)
  if (!role) throw new Error(`角色不存在: ${id}`)
  return role
}

/* ---------- 演示用户 ---------- */

export const mockUsers: User[] = [
  { id: "usr-01", username: "admin", email: "admin@cloudpanel.dev", roles: [roleById("role-admin")], teamIds: ["team-prod", "team-staging"], status: "active", lastLogin: "2026-08-11T02:24:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "usr-02", username: "zhangwei", email: "zhangwei@cloudpanel.dev", roles: [roleById("role-operator")], teamIds: ["team-prod"], status: "active", lastLogin: "2026-08-10T09:12:00.000Z", createdAt: "2026-02-14T08:30:00.000Z" },
  { id: "usr-03", username: "lina", email: "lina@cloudpanel.dev", roles: [roleById("role-operator"), roleById("role-viewer")], teamIds: ["team-prod", "team-staging"], status: "active", lastLogin: "2026-08-11T01:05:00.000Z", createdAt: "2026-03-02T11:20:00.000Z" },
  { id: "usr-04", username: "chenyu", email: "chenyu@cloudpanel.dev", roles: [roleById("role-viewer")], teamIds: ["team-staging"], status: "active", lastLogin: "2026-08-07T06:40:00.000Z", createdAt: "2026-04-18T03:10:00.000Z" },
  { id: "usr-05", username: "deploy-bot", email: "bot@cloudpanel.dev", roles: [roleById("role-operator")], teamIds: ["team-prod"], status: "active", lastLogin: "2026-08-11T02:30:00.000Z", createdAt: "2026-01-15T00:00:00.000Z" },
  { id: "usr-06", username: "wangsong", email: "wangsong@cloudpanel.dev", roles: [roleById("role-viewer")], teamIds: [], status: "disabled", lastLogin: "2026-07-28T10:00:00.000Z", createdAt: "2026-05-22T09:00:00.000Z" },
]

/* ---------- 登录凭证(mock) ---------- */

const CREDENTIALS: Record<string, string> = {
  admin: "admin123",
  zhangwei: "123456",
  lina: "123456",
  chenyu: "123456",
  deploybot: "123456",
  wangsong: "123456",
}

const delay = (ms = 300 + Math.random() * 400) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function login(username: string, password: string): Promise<LoginResult> {
  await delay()
  const user = mockUsers.find((u) => u.username === username)
  if (!user || CREDENTIALS[username] !== password) {
    throw new Error("用户名或密码错误")
  }
  if (user.status === "disabled") {
    throw new Error("该账号已被禁用")
  }
  user.lastLogin = new Date().toISOString()
  return {
    user: { ...user, roles: [...user.roles] },
    token: `mock_jwt_${user.username}_${Date.now().toString(36)}`,
  }
}

/* ---------- 审计记录(统一入口:services/mockAudit.ts) ---------- */
