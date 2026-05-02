import { callReports } from './data'

export interface GeneratedCampaign {
  script: string
  objectionHandling: string
  callFlow: string
}

export interface ScoreBreakdown {
  clarity: number
  empathy: number
  compliance: number
}

export interface EvaluationResult {
  scoreBreakdown: ScoreBreakdown
  feedback: string[]
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export async function generateCampaign(input: {
  name: string
  description: string
}): Promise<GeneratedCampaign> {
  await delay(1200 + Math.random() * 800)
  const title = input.name.trim() || 'this campaign'
  return {
    script: `Opening for "${title}": Hi {{first_name}}, this is {{agent}} from {{company}}. I'm calling because ${input.description.slice(0, 120) || 'you recently showed interest'}—do you have 90 seconds?\n\nBridge: Great. Quick context: we help teams like yours reduce callback volume while improving conversion. May I ask two quick questions to see if this is relevant?\n\nClose: Based on what you shared, the next step is a 15-minute fit check. I have {{slot_a}} or {{slot_b}}—which works better?`,
    objectionHandling: `If they say "too expensive": acknowledge, compare total cost vs. headline premium, offer deductible adjustment or bundle.\nIf they say "not interested": ask one diagnostic question (timing vs. fit), offer async one-pager + SMS opt-in.\nIf they say "send email only": confirm channel, set expectation on follow-up time, capture best number.`,
    callFlow: `1) Permission + identity (15s)\n2) Reason for call + relevance hook (20s)\n3) Discovery: 2 targeted questions (60s)\n4) Mini recap + tailored value (45s)\n5) Propose next step with two time options (30s)\n6) Confirm details + thank you`,
  }
}

export async function evaluateCall(callId: string): Promise<EvaluationResult> {
  await delay(700 + Math.random() * 500)
  const row = callReports.find((c) => c.id === callId)
  const base = row?.aiScore ?? 80
  const variance = () =>
    Math.max(60, Math.min(98, base + Math.round((Math.random() - 0.5) * 10)))

  return {
    scoreBreakdown: {
      clarity: variance(),
      empathy: variance(),
      compliance: variance(),
    },
    feedback: [
      row
        ? `Strong alignment with observed outcome: ${row.outcome}.`
        : 'Balanced pacing with clear next-step asks.',
      'Consider shortening monologue segments to under 25 seconds for higher engagement.',
      'Compliance note: consent language was explicit before recording-sensitive sections.',
    ],
  }
}

const SUGGESTIONS = [
  'Ask about budget range before pitching tiers.',
  'Customer sounds hesitant — offer a smaller next step.',
  'Mirror their wording when summarizing concerns.',
  'Confirm timeline for decision-makers.',
  'Offer two concrete meeting slots instead of an open-ended ask.',
  'Pause — invite them to elaborate on "too expensive".',
  'Restate value in dollars saved per month, not percentages.',
]

export function suggestNextLine(): string {
  return SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]!
}

/** Simulated delay for “generate script version” actions (impure; kept out of components). */
export async function scriptVersionDelay(): Promise<void> {
  await delay(1400 + Math.random() * 600)
}

export function pickSuggestions(count = 4): string[] {
  const pool = [...SUGGESTIONS]
  const out: string[] = []
  const n = Math.min(count, pool.length)
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0]!)
  }
  return out
}
