/* ============================================================
   Server Agent 域 — 连接系统数据模型与通信协议
   ------------------------------------------------------------
   Agent 与平台通过 WebSocket/HTTPS 长连接通信,
   消息格式统一为 JSON,见 AgentUpstreamMessage / AgentDownstreamMessage。
   真实场景下由 Agent 进程(Go/Rust/Node)实现,前端仅消费状态。
   ============================================================ */

import type { Container } from "@/types/docker"

/* ---------- Agent 状态(平台侧视图) ---------- */

export type AgentState = "installed" | "pending" | "uninstalled"

export interface AgentStatus {
  serverId: string
  state: AgentState
  version: string | null
  lastHeartbeat: string | null // ISO 时间
  latencyMs: number | null // 最近一次心跳往返延迟
}

/** Agent 安装令牌(一次性,可过期) */
export interface AgentToken {
  serverId: string
  token: string
  expiresAt: string
  /** 用户在 Linux 服务器上执行的安装命令 */
  installCommand: string
}

/* ---------- 上行消息:Agent → 平台 ---------- */

export type AgentUpstreamMessage =
  | {
      type: "register"
      token: string
      hostname: string
      version: string
    }
  | {
      type: "heartbeat"
      serverId: string
      time: string
      version: string
    }
  | {
      type: "metrics"
      serverId: string
      cpu: number
      memory: number
      disk: number
      networkIn: number
      networkOut: number
      time: string
    }
  | {
      type: "system_info"
      serverId: string
      os: string
      cores: number
      ram: string
      storage: string
      time: string
    }
  | {
      type: "docker_containers"
      serverId: string
      containers: Container[]
      time: string
    }

/* ---------- 下行消息:平台 → Agent ---------- */

export type AgentCommandAction =
  | "reboot"
  | "shutdown"
  | "docker_start"
  | "docker_stop"
  | "docker_restart"
  | "exec"

export type AgentDownstreamMessage =
  | {
      type: "command"
      id: string
      action: AgentCommandAction
      params: Record<string, unknown>
    }
  | {
      type: "ack"
      id: string
      ok: boolean
      error?: string
    }

/* ---------- WebSocket 主题扩展 ---------- */

export type AgentWsTopic =
  | "agent:status"
  | "logs:stream"
  | "containers:update"
