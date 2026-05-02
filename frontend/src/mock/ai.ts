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
  clarity: number
  empathy: number
  compliance: number
}

export interface EvaluationResult {
  scoreBreakdown: ScoreBreakdown
  feedback: string[]
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
