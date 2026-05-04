import type {
  ScriptGenerateGoal,
  ScriptItem,
  ScriptVersionSnapshot,
} from '../types/app'
import { callReports } from './data'

/** Single library line: shortcut key + label text (call-center script style). */
export interface ScriptLineItem {
  shortcut: string
  text: string
  tag?: string
}

export interface ScriptCategory {
  id: string
  title: string
  items: ScriptLineItem[]
}

export interface GeneratedCampaign {
  categories: ScriptCategory[]
}

export interface ScoreBreakdown {
  greeting: number
  objectionHandling: number
  closing: number
}

export interface EvaluationResult {
  scoreBreakdown: ScoreBreakdown
  feedback: string[]
  /** Short, specific “why” lines for the call (demo copy). */
  whyInsights: string[]
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function buildCategories(input: {
  name: string
  description: string
}): ScriptCategory[] {
  const title = input.name.trim() || 'Campaign'
  const blurb =
    input.description.trim().slice(0, 160) ||
    'the reason we reached out today'

  const pitchLabel = title.replace(/\s+/g, ' ').slice(0, 40)

  const pitch: ScriptLineItem[] = [
    { shortcut: '0', text: `Pitch — ${pitchLabel}`, tag: '[1]' },
    { shortcut: '11', text: '$50.00 / premium tier anchor' },
    { shortcut: '12', text: '$35.00 / mid tier' },
    { shortcut: '13', text: '$30.00 / balanced ask' },
    { shortcut: '14', text: '$25.00 / lighter commitment' },
    { shortcut: '15', text: '$20.00 / entry tier' },
    { shortcut: '17', text: `Bridge: ${blurb}`, tag: '[1]' },
    { shortcut: '2', text: 'Yes (no amount mentioned yet)' },
    { shortcut: '3', text: 'Unsure — confirm last amount / pledge?' },
  ]

  const rebuttals: ScriptLineItem[] = [
    { shortcut: '50', text: 'Not interested' },
    { shortcut: '51', text: 'Spouse / decision-maker' },
    { shortcut: '52', text: 'Call back' },
    { shortcut: '53', text: 'Financial' },
    { shortcut: '54', text: 'Hesitant' },
    { shortcut: '55', text: 'Only local' },
    { shortcut: '56', text: 'No phone donations' },
    { shortcut: '57', text: 'Already donated / envelope' },
    { shortcut: '58', text: 'Send receipt?' },
    { shortcut: '59', text: 'What amount?', tag: '[1]' },
    { shortcut: '60', text: 'Previous amount?' },
    { shortcut: '61', text: 'Previous card on file?', tag: '[1]' },
    { shortcut: '62', text: 'Wrong person' },
  ]

  const faqs: ScriptLineItem[] = [
    { shortcut: '!', text: 'Phone / callback number', tag: '[1]' },
    { shortcut: '@', text: 'Website / self-serve link', tag: '[1]' },
    { shortcut: '#', text: 'How reference / campaign code appears' },
    { shortcut: '$', text: 'Paid / payment methods' },
    { shortcut: '%', text: 'Percent / allocation breakdown' },
    { shortcut: '^', text: 'Local vs national scope' },
    { shortcut: '&', text: 'Support / customer care' },
    { shortcut: '*', text: `Organization — tie to "${title}"` },
    { shortcut: '(', text: 'Call ID / disclosure' },
    { shortcut: ')', text: 'On DNC — honor immediately' },
    { shortcut: '-', text: 'Location / territory' },
    { shortcut: '=', text: 'Tax deductible statement', tag: '[1]' },
    { shortcut: '`', text: 'Drive length / campaign window', tag: '[1]' },
  ]

  const pageMessages: ScriptLineItem[] = [
    { shortcut: 'A', text: 'Ask' },
    { shortcut: 'B', text: 'Busy' },
    { shortcut: 'C', text: 'Clarification' },
    { shortcut: 'E', text: 'Explanation' },
  ]

  const conversation: ScriptLineItem[] = [
    { shortcut: 'F', text: 'From / attribution line', tag: '[1]' },
    { shortcut: 'G', text: 'Gratitude', tag: '[1]' },
    { shortcut: 'H', text: 'Hello / opening', tag: '[1]' },
    { shortcut: 'I', text: 'I understand', tag: '[1]' },
    { shortcut: 'J', text: 'Just a moment', tag: '[1]' },
    { shortcut: 'K', text: 'Is that okay?', tag: '[1]' },
    { shortcut: 'L', text: 'Light rapport', tag: '[1]' },
    { shortcut: 'N', text: 'No path — soften', tag: '[1]' },
    { shortcut: 'O', text: 'Okay — acknowledge', tag: '[1]' },
    { shortcut: 'P', text: 'Purpose' },
    { shortcut: 'Q', text: 'Question' },
    { shortcut: 'R', text: 'Repeat / confirm', tag: '[1]' },
    { shortcut: 'S', text: 'Sympathy', tag: '[1]' },
    { shortcut: 'T', text: 'Time / pacing', tag: '[1]' },
    { shortcut: 'U', text: 'Uh huh / active listen', tag: '[1]' },
    { shortcut: 'V', text: 'Very busy — shorten', tag: '[1]' },
    { shortcut: 'W', text: 'Who should we include?' },
    { shortcut: 'X', text: 'Exit / wrap cue' },
    { shortcut: 'Y', text: 'Yes — confirm', tag: '[1]' },
    { shortcut: 'Z', text: 'Transfer / specialist handoff' },
  ]

  const dtmf: ScriptLineItem[] = [
    { shortcut: '70', text: 'Press 0' },
    { shortcut: '71', text: 'Press 1' },
  ]

  return [
    {
      id: 'pitch',
      title: `Pitch — ${pitchLabel}`,
      items: pitch,
    },
    { id: 'rebuttals', title: 'Rebuttals', items: rebuttals },
    { id: 'faqs', title: 'FAQs', items: faqs },
    { id: 'page', title: 'Page Messages', items: pageMessages },
    { id: 'conversation', title: 'Conversation', items: conversation },
    { id: 'dtmf', title: 'DTMF Tones', items: dtmf },
  ]
}

/** Offline mock — full multi-panel library (no OpenAI). */
export async function generateCampaign(input: {
  name: string
  description: string
}): Promise<GeneratedCampaign> {
  await delay(1200 + Math.random() * 800)
  return {
    categories: buildCategories(input),
  }
}

function whyForCall(
  row: (typeof callReports)[number] | undefined,
): string[] {
  if (!row) {
    return [
      'Model could not match a stored call — showing generic coaching notes.',
    ]
  }
  const d = row.durationSeconds
  const out: string[] = []
  if (d < 90) {
    out.push('Call ended very early — opportunity to tighten the opening or confirm contact quality.')
  }
  if (row.sentiment === 'Negative') {
    out.push('Customer disengaged after a key moment — check tone and pace in the last third of the call.')
  }
  if (row.outcome === 'Declined' && /price|expensive|premium|cost/i.test(row.transcript)) {
    out.push('Customer lost interest after pricing was raised — try value framing before numbers next time.')
  }
  if (row.outcome === 'Booked' || row.outcome === 'Qualified') {
    out.push('Strong discovery and next-step clarity — good template for the team library.')
  } else if (row.outcome === 'Follow-up') {
    out.push('Agent missed a clean calendar close — offer two specific slots before ending.')
  }
  if (out.length < 2) {
    out.push('Rapport was adequate; objection handling could be more specific to the customer’s exact words.')
  }
  if (out.length < 3) {
    out.push('Consider echoing the customer’s goal in the first 20 seconds to lock attention.')
  }
  return out.slice(0, 3)
}

export async function evaluateCall(callId: string): Promise<EvaluationResult> {
  await delay(700 + Math.random() * 500)
  const row = callReports.find((c) => c.id === callId)
  const base = row?.aiScore ?? 80
  const variance = () =>
    Math.max(55, Math.min(98, base + Math.round((Math.random() - 0.5) * 8)))

  return {
    scoreBreakdown: {
      greeting: Math.max(55, Math.min(98, base + Math.round((Math.random() - 0.4) * 8))),
      objectionHandling: variance(),
      closing: variance(),
    },
    feedback: [
      row
        ? `Outcome label: ${row.outcome} — use this as the ground truth for coaching.`
        : 'Balanced pacing with clear next-step asks.',
      'Tighten monologue blocks: aim for under 25 seconds per agent turn in the first 3 minutes.',
      'Confirm consent and recording rules where required by your program.',
    ],
    whyInsights: whyForCall(row),
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

const GOAL_FEEDBACK: Record<ScriptGenerateGoal, (name: string) => string> = {
  conversion: (name) =>
    `Lift trials show tighter discovery-to-ask timing improves booked outcomes for “${name}”. Keep proof points inside the first two minutes and restate the customer’s goal before any dollar figures — conversion climbs when the ask feels inevitable, not bolted on.`,
  objections: (name) =>
    `Listeners stay engaged on “${name}” when reps acknowledge friction early. Price objections spike mid-call—insert empathy bridges that mirror the prospect’s words before answering; this reduces defensive reactions after pricing.`,
  shorter: (name) =>
    `Shorter talk tracks for “${name}” reduce mid-call fatigue. Agents who qualify in under 90 seconds see fewer abrupt hang-ups during pitch—trim monologue turns while preserving rapport checkpoints.`,
  closing: (name) =>
    `Closing sections on “${name}” convert better with a forced choice between two next steps plus a concise recap of value. Replace open-ended “does that work?” wraps with calendar-ready alternatives.`,
}

/** Applies a simulated AI revision pass (demo metrics + copy). */
export function upgradeScriptDraft(
  script: ScriptItem,
  goal: ScriptGenerateGoal,
): ScriptItem {
  const jitter = () => (Math.random() - 0.5)
  const nextV = script.version + 1

  let conversionPct = script.conversionPct
  let avgDurationMin = script.avgDurationMin
  let sentimentScore = script.sentimentScore
  let performancePct = script.performancePct
  const lastSnap = script.versionHistory[script.versionHistory.length - 1]
  let engagementPct = lastSnap?.engagementPct ?? 68

  switch (goal) {
    case 'conversion':
      conversionPct = Math.min(48, conversionPct + 1.4 + jitter() * 2.5)
      performancePct = Math.min(96, performancePct + 2 + jitter() * 2)
      engagementPct = Math.min(92, engagementPct + 2 + jitter() * 2)
      break
    case 'objections':
      sentimentScore = Math.min(94, sentimentScore + 2.5 + jitter() * 2)
      conversionPct = Math.min(48, conversionPct + 0.9 + jitter() * 1.5)
      performancePct = Math.min(96, performancePct + 1 + jitter())
      engagementPct = Math.min(92, engagementPct + 1 + jitter())
      break
    case 'shorter':
      avgDurationMin = Math.max(3.2, avgDurationMin - 0.32 + jitter() * 0.12)
      engagementPct = Math.min(92, engagementPct + 1.8 + jitter())
      performancePct = Math.min(96, performancePct + 1 + jitter())
      break
    case 'closing':
      conversionPct = Math.min(48, conversionPct + 2 + jitter() * 2)
      performancePct = Math.min(96, performancePct + 2.5 + jitter() * 2)
      engagementPct = Math.min(92, engagementPct + 2 + jitter() * 2)
      break
  }

  conversionPct = Math.round(conversionPct * 10) / 10
  avgDurationMin = Math.round(avgDurationMin * 10) / 10
  sentimentScore = Math.round(Math.min(96, sentimentScore))

  const aiScore = Math.min(
    97,
    Math.round((sentimentScore + performancePct + engagementPct) / 3),
  )

  const snapshot: ScriptVersionSnapshot = {
    version: nextV,
    conversionPct,
    avgDurationMin,
    aiScore,
    engagementPct: Math.round(engagementPct),
  }

  const snippetHints: Record<ScriptGenerateGoal, string> = {
    conversion: ' [AI: tightened discovery→ask; added proof hooks]',
    objections: ' [AI: empathy bridges before price]',
    shorter: ' [AI: trimmed talk tracks]',
    closing: ' [AI: stronger double-slot close]',
  }

  const trendBump = script.performanceTrend.map((p, i, arr) =>
    i === arr.length - 1
      ? {
          ...p,
          value: Math.min(95, p.value + 1 + Math.round(Math.random())),
        }
      : p,
  )

  return {
    ...script,
    version: nextV,
    conversionPct: snapshot.conversionPct,
    avgDurationMin: snapshot.avgDurationMin,
    sentimentScore,
    performancePct: Math.round(performancePct),
    snippet: script.snippet + snippetHints[goal],
    aiFeedback: GOAL_FEEDBACK[goal](script.name),
    versionHistory: [...script.versionHistory, snapshot],
    performanceTrend: trendBump,
  }
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
