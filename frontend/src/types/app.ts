export type AppSection =
  | 'dashboard'
  | 'campaign'
  | 'reports'
  | 'scripts'
  | 'insights'
  | 'users'
  | 'agent'

export type CallOutcome = 'Booked' | 'Follow-up' | 'No answer' | 'Declined' | 'Qualified'

export type Sentiment = 'Positive' | 'Neutral' | 'Negative'

export interface CallReportRow {
  id: string
  agent: string
  duration: string
  outcome: CallOutcome
  aiScore: number
  sentiment: Sentiment
  transcript: string
}

export interface ScriptItem {
  id: string
  name: string
  version: number
  performancePct: number
  snippet: string
}
