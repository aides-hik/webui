/* ============================================================
   Docker 域数据模型
   ============================================================ */

export type ContainerStatus = "running" | "stopped" | "exited"

export interface Container {
  id: string
  name: string
  image: string
  status: ContainerStatus
  ports: string
  createdAt: string
}

export type ContainerAction = "start" | "stop" | "restart"

export interface ContainerActionRequest {
  containerId: string
  action: ContainerAction
}
