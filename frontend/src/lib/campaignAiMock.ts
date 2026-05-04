/**
 * Deterministic “AI” campaign draft for demos — no network required.
 * Swap for real LLM when backend is ready.
 */
import type {
  AgentSoundboardBundle,
  SoundboardLine,
  SoundboardPanel,
} from '../types/app'

export type AiCampaignDraft = {
  audience: string
  objective: string
  suggestedScript: string
  tone: string
}

export function generateCampaignFromDescription(description: string): AiCampaignDraft {
  const t = description.trim().toLowerCase()
  const hash = t.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  let tone = 'Friendly consultative'
  if (/urgent|asap|flash|limited/i.test(t)) tone = 'Direct and time-bound'
  else if (/vip|executive|enterprise|c-suite/i.test(t)) tone = 'Executive consultative'
  else if (/win-back|churn|lost|cancel/i.test(t)) tone = 'Empathetic recovery'
  else if (/inbound|demo|trial|signup/i.test(t)) tone = 'Professional upbeat'

  let audience =
    'Contacts with valid phone consent in your CRM; prioritize leads touched in the last 90 days.'
  if (/renewal|expir|laps/i.test(t)) {
    audience =
      'Policyholders entering renewal window (T-45 to T-15) with outbound dial consent and verified mobile.'
  } else if (/win-back|competitor|churn/i.test(t)) {
    audience =
      'Former customers who cited price or coverage gaps; suppress litigation-risk accounts.'
  } else if (/cold|outbound|prospect/i.test(t)) {
    audience =
      'Cold outbound list — verified numbers only; skip DNC and recent opt-outs from your suppression file.'
  } else if (/demo|inbound|request/i.test(t)) {
    audience =
      'Inbound form fills and click-to-call leads with product interest in the last 14 days.'
  }

  let objective = 'Book a qualified next step (meeting, renewal review, or documented follow-up).'
  if (/renewal|discount|save/i.test(t)) {
    objective =
      'Recover renewal conversations, present retention bundle, and secure a committed renewal date.'
  } else if (/win-back/i.test(t)) {
    objective =
      'Re-open the relationship with a competitive bridge offer and schedule a policy review.'
  }

  let suggestedScript =
    'Opening: permission + reason for call. Middle: one discovery question, single value lever. Close: two-option next step with explicit time box.'
  if (hash % 3 === 0) {
    suggestedScript =
      'Permission → identity confirm → “quick recap” of why you’re calling → one ROI anchor → choice close (A/B bundle vs deductible tweak).'
  } else if (hash % 3 === 1) {
    suggestedScript =
      'Acknowledge status → mirror concern → offer side-by-side snapshot → invite short calendar hold.'
  }

  return {
    audience,
    objective,
    suggestedScript,
    tone,
  }
}

function hashSeed(parts: string[]): number {
  return parts.join('|').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

/** Placeholder panels — swap for LLM-generated content later. */
const DUMMY_REBUTTALS: SoundboardPanel = {
  id: 'rebuttals',
  title: 'Rebuttals',
  items: [
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
  ],
}

const DUMMY_FAQS: SoundboardPanel = {
  id: 'faqs',
  title: 'FAQs',
  items: [
    { shortcut: '!', text: 'Phone / callback number' },
    { shortcut: '@', text: 'Website', tag: '[1]' },
    { shortcut: '#', text: 'How reference / campaign code appears' },
    { shortcut: '$', text: 'Paid / balance status' },
    { shortcut: '*', text: 'Organization name' },
    { shortcut: '=', text: 'Tax deductible', tag: '[1]' },
    { shortcut: "'", text: 'Drive length / campaign window', tag: '[1]' },
  ],
}

const DUMMY_CONVERSATION: SoundboardPanel = {
  id: 'conversation',
  title: 'Conversation',
  items: [
    { shortcut: 'F', text: 'From / attribution line', tag: '[1]' },
    { shortcut: 'G', text: 'Gratitude', tag: '[1]' },
    { shortcut: 'H', text: 'Hello / acknowledgment', tag: '[1]' },
    { shortcut: 'I', text: 'I understand', tag: '[1]' },
    { shortcut: 'L', text: 'Light humor / rapport', tag: '[1]' },
    { shortcut: 'P', text: 'Purpose of call' },
    { shortcut: 'S', text: 'Sympathy', tag: '[1]' },
    { shortcut: 'V', text: 'Very busy — respect time', tag: '[1]' },
    { shortcut: 'Y', text: 'Yes / affirmation', tag: '[1]' },
    { shortcut: 'Z', text: 'Live person confirmation' },
  ],
}

const DUMMY_PAGE_MESSAGES: SoundboardPanel = {
  id: 'pageMessages',
  title: 'Page Messages',
  items: [
    { shortcut: 'A', text: 'Ask — clarification prompt' },
    { shortcut: 'B', text: 'Busy — hold / callback' },
    { shortcut: 'C', text: 'Clarification' },
    { shortcut: 'E', text: 'Explanation' },
  ],
}

const DUMMY_DTMF: SoundboardPanel = {
  id: 'dtmf',
  title: 'DTMF Tones',
  items: [
    { shortcut: '70', text: 'Press 0' },
    { shortcut: '71', text: 'Press 1' },
  ],
}

function buildIntroPanel(
  description: string,
  audience: string,
  objective: string,
  tone: string,
  h: number,
): SoundboardPanel {
  const t = description.trim() || 'this campaign'
  const lead = (() => {
    if (h % 2 === 0) {
      return `Hi, this is {{agent}} with {{org}}. I’m reaching out because ${t.slice(0, 120)}${t.length > 120 ? '…' : ''} — do you have about two minutes?`
    }
    return `Thanks for taking the call. Quick context: we’re ${objective.slice(0, 100)}${objective.length > 100 ? '…' : ''} for folks in your situation (${audience.slice(0, 80)}${audience.length > 80 ? '…' : ''}). Sound fair to explore?`
  })()

  const branchGood =
    h % 3 === 0
      ? 'Great — I’ll keep this tight. First I want to confirm I’m speaking with the right person about your account.'
      : 'Perfect. I’ll walk through one comparison, then you can tell me if a follow-up makes sense.'

  const branchRapport =
    tone.includes('Executive')
      ? 'Before numbers — what outcome would make this call worth your time this week?'
      : 'How have things changed since we last connected — still the same priorities on your side?'

  const branchWho =
    'Who should I include on any recap — just you, or is there a partner or billing contact I should note?'

  const branchBad =
    'Totally fine if now isn’t good — would a short text summary or a specific callback window work better?'

  return {
    id: 'intro',
    title: 'Introduction',
    items: [
      { shortcut: '0', text: lead },
      { shortcut: '1', text: branchGood },
      { shortcut: '2', text: branchRapport },
      { shortcut: '3', text: branchWho },
      { shortcut: '4', text: branchBad },
    ],
  }
}

function buildPitchPanel(
  description: string,
  objective: string,
  tone: string,
  h: number,
): SoundboardPanel {
  const core =
    h % 2 === 0
      ? `Here’s the core offer tied to your objective: ${objective.slice(0, 140)}${objective.length > 140 ? '…' : ''}`
      : `What we’re proposing is simple on purpose: align ${description.slice(0, 80)}${description.length > 80 ? '…' : ''} with a single next step so you’re not stuck comparing hypotheticals.`

  const anchors: SoundboardLine[] = [
    { shortcut: '11', text: '$ — Premium anchor / bundle framing', tag: '[1]' },
    { shortcut: '12', text: '$ — Mid-tier alternative', tag: '[1]' },
    { shortcut: '13', text: '$ — Balanced recommendation', tag: '[1]' },
    { shortcut: '14', text: '$ — Lighter commitment path', tag: '[1]' },
    { shortcut: '15', text: '$ — Entry / pilot option', tag: '[1]' },
    {
      shortcut: '16',
      text: `Bridge to value (${tone.slice(0, 48)} tone): recap why this fits what they said in discovery.`,
    },
    {
      shortcut: '17',
      text: 'Two-option close: Tuesday vs Thursday — which calendar slot should I hold while we’re on the phone?',
    },
  ]

  return {
    id: 'pitch',
    title: 'Pitch',
    items: [{ shortcut: '10', text: core, tag: '[1]' }, ...anchors],
  }
}

/**
 * Mock “AI” soundboard: **intro** + **pitch** panels vary with campaign brief;
 * rebuttals, FAQs, conversation, page messages, and DTMF use deterministic placeholders.
 */
export function generateAgentSoundboard(input: {
  description: string
  audience: string
  objective: string
  tone: string
}): AgentSoundboardBundle {
  const { description, audience, objective, tone } = input
  const h = hashSeed([description, audience, objective, tone])

  return {
    generatedAt: new Date().toISOString(),
    intro: buildIntroPanel(description, audience, objective, tone, h),
    pitch: buildPitchPanel(description, objective, tone, h),
    rebuttals: DUMMY_REBUTTALS,
    faqs: DUMMY_FAQS,
    conversation: DUMMY_CONVERSATION,
    pageMessages: DUMMY_PAGE_MESSAGES,
    dtmf: DUMMY_DTMF,
  }
}
