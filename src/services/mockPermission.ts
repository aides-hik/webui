/* ============================================================
   Mock 权限数据 — 资源范围(Team / Assignment)
   ------------------------------------------------------------
   - Team A(生产):admin / zhangwei / lina
   - Team B(测试):lina / chenyu
   - 显式分配:viewer 用户仅可访问被分配的服务器
   ============================================================ */

import type { ServerAssignment, Team } from "@/types/team"

export const teams: Team[] = [
  {
    id: "team-prod",
    name: "生产团队",
    description: "生产环境服务器运维",
    members: ["usr-01", "usr-02", "usr-03"],
  },
  {
    id: "team-staging",
    name: "测试团队",
    description: "测试与预发布环境",
    members: ["usr-03", "usr-04"],
  },
]

/** 显式服务器分配(role.scope === "assigned" 的用户) */
export const assignments: ServerAssignment[] = [
  {
    userId: "usr-04", // chenyu(viewer)
    serverId: "srv-staging-web-01",
    scopes: ["view", "manage"],
  },
  {
    userId: "usr-04",
    serverId: "srv-staging-api-01",
    scopes: ["view"],
  },
  {
    userId: "usr-06", // wangsong(viewer, disabled)
    serverId: "srv-dev-box-01",
    scopes: ["view"],
  },
]

/** 服务器 → 归属团队映射(与 mock-data 的 servers 保持一致) */
export const serverTeamMap: Record<string, string> = {
  "srv-prod-web-01": "team-prod",
  "srv-prod-api-01": "team-prod",
  "srv-prod-db-01": "team-prod",
  "srv-cache-01": "team-prod",
  "srv-edge-lb-01": "team-prod",
  "srv-staging-web-01": "team-staging",
  "srv-staging-api-01": "team-staging",
  "srv-dev-box-01": "team-staging",
}

/** 服务器 → 环境映射 */
export const serverEnvMap: Record<string, "production" | "staging" | "development"> = {
  "srv-prod-web-01": "production",
  "srv-prod-api-01": "production",
  "srv-prod-db-01": "production",
  "srv-cache-01": "production",
  "srv-edge-lb-01": "production",
  "srv-staging-web-01": "staging",
  "srv-staging-api-01": "staging",
  "srv-dev-box-01": "development",
}
