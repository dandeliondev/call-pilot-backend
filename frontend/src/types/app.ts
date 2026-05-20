export type AppSection =
  | 'dashboard'
  | 'campaign'
  | 'live'
  | 'reports'
  | 'scripts'
  | 'insights'
  | 'users'
  | 'agent'
  | 'profile'

/** Items under 📊 Reports Menu (Overview & AI Insights use sections `dashboard` / `insights`). */
export type ReportsMenuId =
  | 'overview'
  | 'calls'
  | 'conversion'
  | 'agents'
  | 'scripts'
  | 'insights'
  | 'campaigns'
  | 'funnel'
  | 'sentiment'

/** Client routing for the Campaigns section (list, wizard, or a single campaign). */
export type CampaignRouteState =
  | { mode: 'list' }
  | { mode: 'wizard' }
  | { mode: 'detail'; campaignId: string }

export type CallOutcome = 'Booked' | 'Follow-up' | 'No answer' | 'Declined' | 'Qualified'

export type Sentiment = 'Positive' | 'Neutral' | 'Negative'

export interface CallCampaignRef {
  id: string
  name: string
}

/** Campaign module lifecycle — keep in sync with product UX. */
export type CampaignLifecycleState =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'

export type CampaignType = 'outbound' | 'inbound'

/** One line in an agent “soundboard” (shortcut + text, classic dialer style). */
export interface SoundboardLine {
  shortcut: string
  text: string
  tag?: string
}

export interface SoundboardPanel {
  id: string
  title: string
  items: SoundboardLine[]
}

/**
 * Full soundboard draft: **intro** and **pitch** are generated (mock “AI”);
 * other panels use fixed placeholder copy until a real model covers them.
 */
export interface AgentSoundboardBundle {
  generatedAt: string
  intro: SoundboardPanel
  pitch: SoundboardPanel
  rebuttals: SoundboardPanel
  faqs: SoundboardPanel
  conversation: SoundboardPanel
  pageMessages: SoundboardPanel
  dtmf: SoundboardPanel
  /** Optional for older saved campaigns — wizard always persists these. */
  closing?: SoundboardPanel
  dispositions?: SoundboardPanel
}

/** Panels the call-flow wizard can regenerate individually (matches bundle keys except generatedAt). */
export type RegenerableSoundboardSection =
  | 'intro'
  | 'pitch'
  | 'rebuttals'
  | 'faqs'
  | 'conversation'
  | 'pageMessages'
  | 'closing'
  | 'dispositions'
  | 'dtmf'

/** {id, name} pair used for campaign assignees and the agent/manager directories. */
export interface CampaignAssignee {
  id: number
  name: string
}

/** Persisted campaign record (served by Laravel; previously localStorage). */
export interface ManagedCampaign {
  id: string
  name: string
  description: string
  status: CampaignLifecycleState
  type: CampaignType
  createdAt: string
  /** ISO — when dialing window starts */
  scheduleStart: string | null
  /** ISO — optional end */
  scheduleEnd: string | null
  timezone: string
  /** Real users (id + display name) assigned as agents on this campaign. */
  assignedAgents: CampaignAssignee[]
  /** Real users assigned as campaign managers (oversight/approvals/reporting). */
  assignedCampaignManagers: CampaignAssignee[]
  scriptId: string | null
  scriptName: string | null
  callLimitDaily: number
  pacingSecondsBetweenCalls: number
  /** Step 1 AI draft (mock or enhanced later) */
  aiAudience: string
  aiObjective: string
  aiSuggestedScript: string
  aiTone: string
  /** A/B placeholder — second script id */
  abScriptId: string | null
  /** Template used when creating, if any */
  templateId: string | null
  /** Wizard-generated soundboard (AI intro/pitch + dummy sections). */
  agentSoundboard?: AgentSoundboardBundle
  /** Call-flow generator complexity (basic vs advanced line sets). */
  callFlowComplexity?: 'basic' | 'advanced'
}

export interface CallReportRow {
  id: string
  agent: string
  /** Display e.g. "8:42" */
  duration: string
  /** Parsed length for filtering and charts */
  durationSeconds: number
  outcome: CallOutcome
  aiScore: number
  sentiment: Sentiment
  transcript: string
  campaignId: string
  campaignName: string
  /** ISO timestamp for date-range filters */
  startedAt: string
  /** Seed tags; users can add more in-session */
  tags: string[]
}

/** Rolling snapshots for version comparison (demo data). */
export interface ScriptVersionSnapshot {
  version: number
  conversionPct: number
  avgDurationMin: number
  aiScore: number
  engagementPct: number
}

export type ScriptGenerateGoal =
  | 'conversion'
  | 'objections'
  | 'shorter'
  | 'closing'

export interface ScriptOutcomeCounts {
  Booked: number
  'Follow-up': number
  Qualified: number
  Declined: number
  'No answer': number
}

export interface ScriptSection {
  id: string
  title: string
  body: string
  /** Demo weak-point hints for coaching overlays */
  weak?: 'dropoff' | 'objection'
}

export interface ScriptItem {
  id: string
  /** Owning campaign — scripts are scoped per campaign in the library. */
  campaignId: string
  name: string
  version: number
  /** Composite “health” score (legacy headline, still shown as overview) */
  performancePct: number
  snippet: string
  conversionPct: number
  avgDurationMin: number
  /** 0–100 positive-sentiment proxy */
  sentimentScore: number
  outcomeBreakdown: ScriptOutcomeCounts
  funnel: {
    dialed: number
    connected: number
    qualified: number
    converted: number
  }
  aiFeedback: string
  tags: string[]
  sections: ScriptSection[]
  versionHistory: ScriptVersionSnapshot[]
  /** Last 7 sessions — performance index for sparkline */
  performanceTrend: { day: string; value: number }[]
}
