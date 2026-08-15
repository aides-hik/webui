/* ============================================================
   团队 API
   - list / create / update / remove
   - Mock 实现维护 mockPermission.teams(会话内持久),
     行为与 Teams 页面原逻辑一致(无审计写入)。
   ============================================================ */

import { api } from "@/api/client"
import { teams } from "@/services/mockPermission"
import type { Team } from "@/types/team"

/** 创建团队输入(与 Teams 页面表单一致) */
export interface NewTeamInput {
  name: string
  description?: string
  memberIds: string[]
}

export interface TeamApi {
  list(): Promise<Team[]>
  create(input: NewTeamInput): Promise<Team>
  update(
    id: string,
    patch: Partial<Pick<Team, "name" | "description" | "members">>
  ): Promise<Team>
  remove(id: string): Promise<void>
}

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

const copyTeam = (t: Team): Team => ({ ...t, members: [...t.members] })

const mockTeamApi: TeamApi = {
  list: async () => teams.map(copyTeam),

  create: async (input) => {
    const team: Team = {
      id: `team-${Date.now().toString(36)}`,
      name: input.name.trim(),
      description: input.description,
      members: [...input.memberIds],
    }
    teams.push(team)
    return copyTeam(team)
  },

  update: async (id, patch) => {
    const index = teams.findIndex((t) => t.id === id)
    if (index === -1) throw new Error(`团队不存在: ${id}`)
    const next: Team = {
      ...teams[index],
      name: patch.name?.trim() ?? teams[index].name,
      description: patch.description,
      members: patch.members ? [...patch.members] : teams[index].members,
    }
    teams[index] = next
    return copyTeam(next)
  },

  remove: async (id) => {
    const index = teams.findIndex((t) => t.id === id)
    if (index === -1) throw new Error(`团队不存在: ${id}`)
    teams.splice(index, 1)
  },
}

const realTeamApi: TeamApi = {
  list: () => api.get<Team[]>("/teams"),
  create: (input) => api.post<Team>("/teams", input),
  update: (id, patch) => api.put<Team>(`/teams/${id}`, patch),
  remove: (id) => api.delete<void>(`/teams/${id}`),
}

export const teamApi: TeamApi = USE_MOCK ? mockTeamApi : realTeamApi
