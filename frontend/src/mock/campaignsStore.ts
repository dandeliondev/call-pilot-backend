import type { CampaignLifecycleState, ManagedCampaign } from '../types/app'

const KEY = 'proj-cicero_campaigns_v3'

/** Cached snapshot so `loadCampaigns()` returns a stable reference for useSyncExternalStore. */
let cachedCampaigns: ManagedCampaign[] | null = null

const listeners = new Set<() => void>()

export function subscribeCampaigns(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(): void {
  listeners.forEach((l) => l())
}

const KNOWN_AGENTS = [
  'Sarah Chen',
  'Marcus Lee',
  'Priya Sharma',
  'John Doe',
  'Elena Rossi',
] as const

function defaultCampaign(
  id: string,
  name: string,
  description: string,
  status: CampaignLifecycleState,
  type: ManagedCampaign['type'],
  extra: Partial<ManagedCampaign> = {},
): ManagedCampaign {
  const now = new Date().toISOString()
  return {
    id,
    name,
    description,
    status,
    type,
    createdAt: extra.createdAt ?? now,
    scheduleStart: extra.scheduleStart ?? null,
    scheduleEnd: extra.scheduleEnd ?? null,
    timezone: extra.timezone ?? 'America/New_York',
    assignedAgents: extra.assignedAgents ?? [...KNOWN_AGENTS].slice(0, 2),
    scriptId: 'scriptId' in extra ? extra.scriptId ?? null : 's1',
    scriptName: (() => {
      if (Object.prototype.hasOwnProperty.call(extra, 'scriptName')) {
        return extra.scriptName ?? null
      }
      if (id === 'camp-demo') return 'Inbound demo request'
      if (id === 'camp-winback') return 'Win-back — competitor mention'
      return 'Outbound renewal — warm intro'
    })(),
    callLimitDaily: extra.callLimitDaily ?? 500,
    pacingSecondsBetweenCalls: extra.pacingSecondsBetweenCalls ?? 12,
    aiAudience:
      extra.aiAudience ??
      'Policyholders 30–60 days before renewal with open outbound consent.',
    aiObjective:
      extra.aiObjective ??
      'Secure a booked renewal conversation or qualified follow-up.',
    aiSuggestedScript:
      extra.aiSuggestedScript ??
      'Permission-based intro → confirm identity → value anchor → bundle/options close.',
    aiTone: extra.aiTone ?? 'Friendly consultative',
    abScriptId: extra.abScriptId ?? null,
    templateId: extra.templateId ?? null,
    agentSoundboard: extra.agentSoundboard,
  }
}

export function seedCampaigns(): ManagedCampaign[] {
  const week = new Date()
  week.setDate(week.getDate() + 2)
  return [
    defaultCampaign(
      'camp-renewal',
      'Outbound renewal — warm intro',
      'Warm renewal outreach for policies nearing expiry; emphasize bundle savings.',
      'active',
      'outbound',
      {
        createdAt: '2026-04-10T14:00:00Z',
        scheduleStart: '2026-04-12T13:00:00Z',
        assignedAgents: ['Sarah Chen', 'Marcus Lee', 'Priya Sharma'],
        scriptId: 's1',
        abScriptId: 's4',
        templateId: 'renewal',
      },
    ),
    defaultCampaign(
      'camp-demo',
      'Inbound demo request',
      'Inbound leads requesting product demos; qualify budget and timeline.',
      'active',
      'inbound',
      {
        createdAt: '2026-04-22T10:30:00Z',
        scheduleStart: '2026-04-22T09:00:00Z',
        assignedAgents: ['John Doe', 'Elena Rossi'],
        scriptId: 's2',
        aiTone: 'Professional upbeat',
      },
    ),
    defaultCampaign(
      'camp-winback',
      'Win-back — competitor mention',
      'Re-engage churn-risk customers who cited competitor pricing.',
      'paused',
      'outbound',
      {
        createdAt: '2026-03-01T11:00:00Z',
        scheduleStart: '2026-03-05T14:00:00Z',
        assignedAgents: ['Sarah Chen', 'Elena Rossi'],
        scriptId: 's3',
        status: 'paused',
      },
    ),
    defaultCampaign(
      'camp-draft-sample',
      'Q3 nurture — SMB (draft)',
      'Placeholder draft for SMB nurture experiments.',
      'draft',
      'outbound',
      {
        createdAt: new Date().toISOString(),
        assignedAgents: ['Marcus Lee'],
        scriptId: null,
        scriptName: null,
      },
    ),
  ]
}

function parseStatus(s: unknown): CampaignLifecycleState {
  if (
    s === 'draft' ||
    s === 'scheduled' ||
    s === 'active' ||
    s === 'paused' ||
    s === 'completed' ||
    s === 'archived'
  ) {
    return s
  }
  return 'draft'
}

export function loadCampaigns(): ManagedCampaign[] {
  if (cachedCampaigns !== null) {
    return cachedCampaigns
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedCampaigns = parsed.map(migrate)
        return cachedCampaigns
      }
    }
  } catch {
    /* ignore */
  }
  const s = seedCampaigns()
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
  cachedCampaigns = s
  return cachedCampaigns
}

function migrate(raw: unknown): ManagedCampaign {
  const r = raw as Partial<ManagedCampaign>
  const id = String(r.id ?? `camp-${Date.now()}`)
  return defaultCampaign(
    id,
    String(r.name ?? 'Campaign'),
    String(r.description ?? ''),
    parseStatus(r.status),
    r.type === 'inbound' ? 'inbound' : 'outbound',
    { ...r, id } as Partial<ManagedCampaign>,
  )
}

export function saveCampaigns(list: ManagedCampaign[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
  cachedCampaigns = list
  emit()
}

export function getCampaign(id: string): ManagedCampaign | undefined {
  return loadCampaigns().find((c) => c.id === id)
}

export function createCampaign(c: ManagedCampaign): void {
  const list = loadCampaigns()
  saveCampaigns([c, ...list])
}

export function updateCampaign(
  id: string,
  patch: Partial<ManagedCampaign>,
): void {
  const list = loadCampaigns()
  const next = list.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c))
  saveCampaigns(next)
}

export function listKnownAgents(): readonly string[] {
  return KNOWN_AGENTS
}
