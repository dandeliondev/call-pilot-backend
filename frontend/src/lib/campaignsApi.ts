import { apiFetch } from './api'
import type { ManagedCampaign } from '../types/app'

export interface DirectoryUser {
  id: number
  name: string
}

interface DataEnvelope<T> {
  data: T
}

interface CampaignPayload {
  id?: string
  name: string
  description: string
  status: ManagedCampaign['status']
  type: ManagedCampaign['type']
  schedule_start: string | null
  schedule_end: string | null
  timezone: string
  script_id: string | null
  script_name: string | null
  ab_script_id: string | null
  template_id: string | null
  call_limit_daily: number
  pacing_seconds_between_calls: number
  ai_audience: string
  ai_objective: string
  ai_suggested_script: string
  ai_tone: string
  agent_soundboard: ManagedCampaign['agentSoundboard']
  call_flow_complexity: ManagedCampaign['callFlowComplexity'] | null
  assigned_agent_ids: number[]
  assigned_campaign_manager_ids: number[]
}

export function buildCampaignPayload(c: Omit<ManagedCampaign, 'id' | 'createdAt'> & { id?: string }): CampaignPayload {
  return {
    name: c.name,
    description: c.description,
    status: c.status,
    type: c.type,
    schedule_start: c.scheduleStart,
    schedule_end: c.scheduleEnd,
    timezone: c.timezone,
    script_id: c.scriptId,
    script_name: c.scriptName,
    ab_script_id: c.abScriptId,
    template_id: c.templateId,
    call_limit_daily: c.callLimitDaily,
    pacing_seconds_between_calls: c.pacingSecondsBetweenCalls,
    ai_audience: c.aiAudience,
    ai_objective: c.aiObjective,
    ai_suggested_script: c.aiSuggestedScript,
    ai_tone: c.aiTone,
    agent_soundboard: c.agentSoundboard,
    call_flow_complexity: c.callFlowComplexity ?? null,
    assigned_agent_ids: c.assignedAgents.map((a) => a.id),
    assigned_campaign_manager_ids: c.assignedCampaignManagers.map((m) => m.id),
  }
}

export async function fetchCampaigns(): Promise<ManagedCampaign[]> {
  const res = await apiFetch<DataEnvelope<ManagedCampaign[]>>('/api/campaigns')
  return res.data
}

export async function fetchCampaign(id: string): Promise<ManagedCampaign> {
  const res = await apiFetch<DataEnvelope<ManagedCampaign>>(`/api/campaigns/${id}`)
  return res.data
}

export async function createCampaignApi(
  payload: Omit<ManagedCampaign, 'id' | 'createdAt'>,
): Promise<ManagedCampaign> {
  const res = await apiFetch<DataEnvelope<ManagedCampaign>>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(buildCampaignPayload(payload)),
  })
  return res.data
}

export async function updateCampaignApi(
  id: string,
  patch: Partial<Omit<ManagedCampaign, 'id' | 'createdAt'>>,
): Promise<ManagedCampaign> {
  const body: Partial<CampaignPayload> = {}
  if (patch.name !== undefined) body.name = patch.name
  if (patch.description !== undefined) body.description = patch.description
  if (patch.status !== undefined) body.status = patch.status
  if (patch.type !== undefined) body.type = patch.type
  if (patch.scheduleStart !== undefined) body.schedule_start = patch.scheduleStart
  if (patch.scheduleEnd !== undefined) body.schedule_end = patch.scheduleEnd
  if (patch.timezone !== undefined) body.timezone = patch.timezone
  if (patch.scriptId !== undefined) body.script_id = patch.scriptId
  if (patch.scriptName !== undefined) body.script_name = patch.scriptName
  if (patch.abScriptId !== undefined) body.ab_script_id = patch.abScriptId
  if (patch.templateId !== undefined) body.template_id = patch.templateId
  if (patch.callLimitDaily !== undefined) body.call_limit_daily = patch.callLimitDaily
  if (patch.pacingSecondsBetweenCalls !== undefined)
    body.pacing_seconds_between_calls = patch.pacingSecondsBetweenCalls
  if (patch.aiAudience !== undefined) body.ai_audience = patch.aiAudience
  if (patch.aiObjective !== undefined) body.ai_objective = patch.aiObjective
  if (patch.aiSuggestedScript !== undefined) body.ai_suggested_script = patch.aiSuggestedScript
  if (patch.aiTone !== undefined) body.ai_tone = patch.aiTone
  if (patch.agentSoundboard !== undefined) body.agent_soundboard = patch.agentSoundboard
  if (patch.callFlowComplexity !== undefined)
    body.call_flow_complexity = patch.callFlowComplexity ?? null
  if (patch.assignedAgents !== undefined)
    body.assigned_agent_ids = patch.assignedAgents.map((a) => a.id)
  if (patch.assignedCampaignManagers !== undefined)
    body.assigned_campaign_manager_ids = patch.assignedCampaignManagers.map((m) => m.id)

  const res = await apiFetch<DataEnvelope<ManagedCampaign>>(`/api/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function fetchAgents(): Promise<DirectoryUser[]> {
  const res = await apiFetch<DataEnvelope<DirectoryUser[]>>('/api/users/agents')
  return res.data
}

export async function fetchCampaignManagers(): Promise<DirectoryUser[]> {
  const res = await apiFetch<DataEnvelope<DirectoryUser[]>>('/api/users/campaign-managers')
  return res.data
}
