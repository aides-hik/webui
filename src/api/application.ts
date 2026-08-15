/* ============================================================
   应用 API
   - list / changeStatus(start / stop / restart)
   - Mock 实现维护运行时数组(以种子初始化,会话内持久),
     状态转换逻辑与 Applications 页面原行为一致(无审计写入)。
   ============================================================ */

import { api } from "@/api/client"
import { applications as seedApplications } from "@/lib/mock-data"
import type {
  Application,
  ApplicationAction,
  ApplicationStatus,
} from "@/types/application"

export interface ApplicationApi {
  list(): Promise<Application[]>
  changeStatus(id: string, action: ApplicationAction): Promise<Application>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

/** 运行时数据:以种子初始化,后续变更只作用于本数组 */
const runtimeApps: Application[] = seedApplications.map((a) => ({ ...a }))

/** 与页面原 handleStatusChange 完全一致的状态转换 */
function nextStatus(status: ApplicationStatus, action: ApplicationAction): ApplicationStatus {
  if (action === "start") return "running"
  if (action === "stop") return "stopped"
  return status === "running" ? "stopped" : "running"
}

const mockApplicationApi: ApplicationApi = {
  list: async () => runtimeApps.map((a) => ({ ...a })),

  changeStatus: async (id, action) => {
    const index = runtimeApps.findIndex((a) => a.id === id)
    if (index === -1) throw new Error(`应用不存在: ${id}`)
    const prev = runtimeApps[index]
    const next: Application = {
      ...prev,
      status: nextStatus(prev.status, action),
      updatedAt: "刚刚",
    }
    runtimeApps[index] = next
    return { ...next }
  },
}

const realApplicationApi: ApplicationApi = {
  list: () => api.get<Application[]>("/applications"),
  changeStatus: (id, action) =>
    api.post<Application>(`/applications/${id}/action`, { action }),
}

export const applicationApi: ApplicationApi = USE_MOCK
  ? mockApplicationApi
  : realApplicationApi
