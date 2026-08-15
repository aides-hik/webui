/* ============================================================
   Mock 数据层
   ------------------------------------------------------------
   静态种子数据 + 类型 re-export。
   运行时数据由 services/mockServer.ts 维护(带实时抖动);
   类型统一来自 types/,未来接入真实后端时仅需替换 api 层。
   ============================================================ */

import type { ActivityEvent, LogEntry, Server } from "@/types/server"
import type { Container as DockerContainer } from "@/types/docker"
import type { Application } from "@/types/application"

export type {
  Server,
  ServerStatus,
  NewServerInput,
  NewServerInput as NewServer,
  ServerListParams,
  Paginated,
  ActivityEvent,
  ActivityType,
  LogEntry,
  LogLevel,
} from "@/types/server"

export type {
  Container as DockerContainer,
  ContainerStatus as DockerContainerStatus,
} from "@/types/docker"

/* ---------- 服务器种子数据 ---------- */

export const servers: Server[] = [
  { id: "srv-prod-web-01", name: "prod-web-01", hostname: "prod-web-01", ip: "172.16.1.10", port: 22, status: "online", cpu: 42, memory: 68, disk: 54, region: "ap-east-1", os: "Ubuntu 22.04 LTS", createdAt: "2026-06-15T08:00:00.000Z", uptime: "34d 12h", cores: 8, ram: "32 GB", storage: "1 TB" , ownerTeamId: "team-prod", environment: "production" },
  { id: "srv-prod-api-01", name: "prod-api-01", hostname: "prod-api-01", ip: "172.16.1.11", port: 22, status: "online", cpu: 71, memory: 82, disk: 63, region: "ap-east-1", os: "Debian 12", createdAt: "2026-05-02T03:30:00.000Z", uptime: "21d 6h", cores: 16, ram: "64 GB", storage: "2 TB" , ownerTeamId: "team-prod", environment: "production" },
  { id: "srv-prod-db-01", name: "prod-db-01", hostname: "prod-db-01", ip: "172.16.2.20", port: 22, status: "degraded", cpu: 88, memory: 91, disk: 77, region: "ap-northeast-1", os: "Ubuntu 20.04 LTS", createdAt: "2026-01-20T12:00:00.000Z", uptime: "128d 3h", cores: 16, ram: "128 GB", storage: "4 TB" , ownerTeamId: "team-prod", environment: "production" },
  { id: "srv-cache-01", name: "cache-01", hostname: "cache-01", ip: "172.16.2.21", port: 22, status: "online", cpu: 24, memory: 55, disk: 31, region: "ap-east-1", os: "Ubuntu 22.04 LTS", createdAt: "2026-04-11T09:15:00.000Z", uptime: "45d 9h", cores: 4, ram: "16 GB", storage: "512 GB" , ownerTeamId: "team-prod", environment: "production" },
  { id: "srv-edge-lb-01", name: "edge-lb-01", hostname: "edge-lb-01", ip: "172.16.0.10", port: 22, status: "online", cpu: 18, memory: 44, disk: 15, region: "global", os: "Alpine 3.18", createdAt: "2026-03-05T15:45:00.000Z", uptime: "89d 22h", cores: 4, ram: "8 GB", storage: "100 GB" , ownerTeamId: "team-prod", environment: "production" },
  { id: "srv-staging-web-01", name: "staging-web-01", hostname: "staging-web-01", ip: "172.16.3.30", port: 22, status: "online", cpu: 12, memory: 34, disk: 22, region: "eu-central-1", os: "Ubuntu 22.04 LTS", createdAt: "2026-07-01T10:00:00.000Z", uptime: "6d 18h", cores: 4, ram: "16 GB", storage: "500 GB" , ownerTeamId: "team-staging", environment: "staging" },
  { id: "srv-staging-api-01", name: "staging-api-01", hostname: "staging-api-01", ip: "172.16.3.31", port: 22, status: "maintenance", cpu: 5, memory: 18, disk: 41, region: "eu-central-1", os: "Debian 12", createdAt: "2026-07-02T14:20:00.000Z", uptime: "2d 4h", cores: 8, ram: "32 GB", storage: "1 TB" , ownerTeamId: "team-staging", environment: "staging" },
  { id: "srv-dev-box-01", name: "dev-box-01", hostname: "dev-box-01", ip: "172.16.4.40", port: 22, status: "offline", cpu: 0, memory: 0, disk: 66, region: "us-west-2", os: "Fedora 38", createdAt: "2026-02-14T08:30:00.000Z", uptime: "—", cores: 8, ram: "32 GB", storage: "1 TB" , ownerTeamId: "team-staging", environment: "development" },
]

/* ---------- 监控时序种子(24 个采样点) ---------- */

export const cpuHistory = [35, 42, 38, 55, 61, 48, 52, 70, 65, 58, 62, 75, 68, 59, 71, 82, 76, 69, 64, 58, 52, 47, 43, 40]

export const memoryHistory = [52, 54, 53, 58, 62, 61, 63, 66, 68, 65, 67, 72, 74, 73, 75, 78, 76, 74, 71, 68, 66, 64, 63, 62]

/** 网络流量 MB/s */
export const networkInHistory = [120, 180, 150, 240, 310, 280, 220, 350, 420, 380, 300, 450, 520, 480, 390, 560, 610, 540, 470, 380, 320, 280, 240, 200]
export const networkOutHistory = [80, 110, 95, 160, 210, 180, 140, 230, 280, 250, 190, 300, 340, 310, 250, 360, 400, 350, 300, 240, 200, 170, 150, 130]

export const historyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`)

/* ---------- 活动事件 ---------- */

export const activityEvents: ActivityEvent[] = [
  { id: "evt-01", type: "reboot", title: "服务器已重启", description: "prod-api-01 完成重启,耗时 42s", time: "12 分钟前", server: "prod-api-01" },
  { id: "evt-02", type: "deploy", title: "应用已部署", description: "staging-web-01 部署 v2.4.1,4 个容器已更新", time: "34 分钟前", server: "staging-web-01" },
  { id: "evt-03", type: "login", title: "用户登录", description: "admin 从 203.0.113.7 登录控制台", time: "1 小时前" },
  { id: "evt-04", type: "config", title: "配置已更新", description: "prod-web-01 Nginx 配置已应用并 reload", time: "2 小时前", server: "prod-web-01" },
  { id: "evt-05", type: "deploy", title: "应用已部署", description: "prod-api-01 部署 v3.0.0,灰度 20%", time: "5 小时前", server: "prod-api-01" },
  { id: "evt-06", type: "warning", title: "磁盘告警", description: "prod-db-01 磁盘使用率超过 75%", time: "6 小时前", server: "prod-db-01" },
  { id: "evt-07", type: "login", title: "自动化登录", description: "deploy-bot 从 10.0.0.4 执行部署任务", time: "8 小时前" },
  { id: "evt-08", type: "reboot", title: "计划重启", description: "edge-lb-01 按维护计划完成重启", time: "1 天前", server: "edge-lb-01" },
]

/* ---------- Docker 容器 ---------- */

export const dockerContainers: DockerContainer[] = [
  { id: "c-01", name: "web", image: "nginx:1.25-alpine", status: "running", ports: "80:80", createdAt: "2 天前" },
  { id: "c-02", name: "api", image: "node:20-slim", status: "running", ports: "3000:3000", createdAt: "3 天前" },
  { id: "c-03", name: "db", image: "postgres:16", status: "running", ports: "5432:5432", createdAt: "7 天前" },
  { id: "c-04", name: "redis", image: "redis:7-alpine", status: "running", ports: "6379:6379", createdAt: "7 天前" },
  { id: "c-05", name: "worker", image: "node:20-slim", status: "running", ports: "—", createdAt: "3 天前" },
  { id: "c-06", name: "batch-job", image: "python:3.11-slim", status: "exited", ports: "—", createdAt: "1 天前" },
]

/* ---------- 日志 ---------- */

export const logEntries: LogEntry[] = [
  { id: "log-01", time: "10:24:31", level: "INFO", source: "web", message: "200 GET /api/v1/servers 42ms" },
  { id: "log-02", time: "10:24:12", level: "WARN", source: "db", message: "slow query 1.2s on servers table" },
  { id: "log-03", time: "10:23:58", level: "INFO", source: "api", message: "201 POST /api/v1/deployments" },
  { id: "log-04", time: "10:22:47", level: "ERROR", source: "api", message: "UnhandledRejection: ECONNRESET upstream" },
  { id: "log-05", time: "10:22:40", level: "INFO", source: "nginx", message: "200 GET /assets/app.js (gzip)" },
  { id: "log-06", time: "10:21:15", level: "INFO", source: "web", message: "200 GET /api/v1/metrics 18ms" },
  { id: "log-07", time: "10:20:02", level: "WARN", source: "web", message: "retrying upstream after 503" },
  { id: "log-08", time: "10:19:44", level: "INFO", source: "api", message: "200 GET /api/v1/containers" },
  { id: "log-09", time: "10:18:30", level: "INFO", source: "auth", message: "200 POST /api/v1/auth/login (admin)" },
  { id: "log-10", time: "10:17:12", level: "ERROR", source: "db", message: "connection pool exhausted (max 20)" },
  { id: "log-11", time: "10:16:55", level: "INFO", source: "web", message: "200 GET / 12ms" },
  { id: "log-12", time: "10:15:40", level: "INFO", source: "cron", message: "backup completed in 4m 12s" },
]

/* ---------- Swap / Disk IO 时序(静态 Mock) ---------- */

export const swapHistory = [18, 20, 19, 24, 28, 26, 25, 30, 33, 31, 29, 34, 38, 36, 35, 41, 44, 42, 39, 36, 33, 31, 30, 29]

/** 磁盘读/写 MB/s */
export const diskIOReadHistory = [120, 180, 150, 260, 310, 240, 200, 380, 420, 330, 280, 450, 510, 460, 380, 560, 620, 540, 470, 390, 320, 280, 240, 210]
export const diskIOWriteHistory = [80, 110, 90, 160, 210, 170, 130, 240, 280, 220, 170, 300, 340, 290, 230, 360, 410, 350, 290, 240, 190, 160, 130, 110]

/** 磁盘占用率历史(迷你图)与当前值 */
export const diskUsageHistory = [54, 55, 55, 56, 57, 58, 60, 61, 62]
export const currentDiskUsage = 62

/* ---------- 应用 ---------- */

export const applications: Application[] = [
  { id: "app-01", name: "web-frontend", serverId: "srv-prod-web-01", serverName: "prod-web-01", status: "running", version: "v2.4.1", port: 80, updatedAt: "2 小时前" },
  { id: "app-02", name: "api-gateway", serverId: "srv-prod-api-01", serverName: "prod-api-01", status: "running", version: "v3.0.0", port: 3000, updatedAt: "5 小时前" },
  { id: "app-03", name: "auth-service", serverId: "srv-prod-api-01", serverName: "prod-api-01", status: "running", version: "v1.8.2", port: 3001, updatedAt: "1 天前" },
  { id: "app-04", name: "order-worker", serverId: "srv-prod-api-01", serverName: "prod-api-01", status: "failed", version: "v2.1.0", port: 0, updatedAt: "3 小时前" },
  { id: "app-05", name: "admin-panel", serverId: "srv-staging-web-01", serverName: "staging-web-01", status: "running", version: "v2.4.1-rc.1", port: 8080, updatedAt: "6 小时前" },
  { id: "app-06", name: "staging-api", serverId: "srv-staging-api-01", serverName: "staging-api-01", status: "stopped", version: "v3.0.0-rc.2", port: 3000, updatedAt: "1 天前" },
  { id: "app-07", name: "cdn-edge", serverId: "srv-edge-lb-01", serverName: "edge-lb-01", status: "running", version: "v1.2.0", port: 443, updatedAt: "4 天前" },
]

/* ---------- 用户(已迁移至 services/mockAuth.ts) ---------- */

/* ---------- 模拟终端 ---------- */
export const terminalWelcome = [
  "WebUI Server Terminal v1.0 (mock)",
  "已连接 prod-api-01 · 支持命令:help / uptime / df / docker ps / ls / clear",
  "输入命令后按 Enter 执行。",
]

/** 模拟命令执行器(未来替换为真实 WebSocket/SSH 通道) */
export function executeMockCommand(cmd: string): string {
  const c = cmd.trim().toLowerCase()
  if (c.startsWith("echo ")) {
    return cmd.trim().slice(5)
  }
  switch (c) {
    case "help":
      return "可用命令: uptime · df -h · free -m · docker ps · ls · echo <text> · date · clear"
    case "uptime":
      return " 10:24:31 up 21 days,  6:12,  1 user,  load average: 0.72, 0.68, 0.61"
    case "df -h":
      return "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       2.0T  1.3T  652G  63% /"
    case "free -m":
      return "               total        used        free      shared  buff/cache   available\nMem:           65536       53760        2104        1024        9672        11776\nSwap:           8192        2457        5735"
    case "docker ps":
      return "CONTAINER ID   IMAGE               STATUS         PORTS\nabc123  web      nginx:1.25-alpine  Up 2 days      0.0.0.0:80->80/tcp\ndef456  api      node:20-slim       Up 3 days      0.0.0.0:3000->3000/tcp"
    case "ls":
      return "app/  backups/  config/  docker-compose.yml  logs/"
    case "date":
      return new Date().toString()
    case "whoami":
      return "root"
    case "clear":
      return "\u0000CLEAR"
    default:
      return `command not found: ${cmd}(mock shell,输入 help 查看可用命令)`
  }
}
