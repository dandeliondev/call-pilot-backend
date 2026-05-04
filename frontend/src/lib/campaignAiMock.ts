/**
 * Deterministic “AI” campaign draft for demos — no network required.
 * Swap for real LLM when backend is ready.
 */
import type {
  AgentSoundboardBundle,
  RegenerableSoundboardSection,
  SoundboardLine,
  SoundboardPanel,
} from '../types/app'

export type AiCampaignDraft = {
  /** Short title derived from the brief (mock “AI”) — use for campaign name. */
  suggestedName: string
  audience: string
  objective: string
  suggestedScript: string
  tone: string
}

function suggestCampaignName(description: string, hash: number): string {
  const raw = description.trim().replace(/\s+/g, ' ')
  if (!raw) return 'Untitled campaign'

  const t = raw.toLowerCase()
  let prefix = 'Outbound campaign'
  if (/renewal|expir|laps/i.test(t)) prefix = 'Renewal outreach'
  else if (/win-back|churn|competitor/i.test(t)) prefix = 'Win-back'
  else if (/inbound|demo|lead|form|signup|trial/i.test(t)) prefix = 'Inbound follow-up'
  else if (/cold|prospect/i.test(t)) prefix = 'Cold outbound'
  else if (/nurture|drip|sequence/i.test(t)) prefix = 'Nurture sequence'

  const excerpt = raw.length <= 56 ? raw : `${raw.slice(0, 53).trimEnd()}…`
  const variants = [`${prefix} — ${excerpt}`, `${prefix}: ${excerpt}`]
  const name = variants[hash % 2]!
  return name.length <= 120 ? name : `${name.slice(0, 117)}…`
}

export type CallFlowComplexity = 'basic' | 'advanced'

export type GenerateSoundboardInput = {
  description: string
  audience: string
  objective: string
  tone: string
  complexity?: CallFlowComplexity
  /** Extra entropy for “regenerate section” without changing the brief. */
  salt?: string
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
    suggestedName: suggestCampaignName(description.trim(), hash),
    audience,
    objective,
    suggestedScript,
    tone,
  }
}

function hashSeed(parts: string[]): number {
  return parts.join('|').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

function buildRebuttalsPanel(h: number): SoundboardPanel {
  const v = h % 3
  const sets: SoundboardLine[][] = [
    [
      { shortcut: '50', text: 'Not interested → “I understand — can I leave one sentence on why others stayed?”' },
      { shortcut: '51', text: 'Busy → “No problem — this is 30 seconds on your renewal window, then I’ll let you go.”' },
      { shortcut: '52', text: 'Too expensive → “Totally fair — are we comparing premium only, or total out-of-pocket if something happens?”' },
      { shortcut: '53', text: 'Send email → “Happy to — what subject line should I use so it doesn’t get buried?”' },
      { shortcut: '54', text: 'Already have coverage → “Great — quick apples-to-apples so you know what you’re comparing.”' },
    ],
    [
      { shortcut: '50', text: 'Not interested → “Understood — one yes/no: still the right person for this account?”' },
      { shortcut: '51', text: 'Call back later → “What time today works — I can text a 1-line recap first.”' },
      { shortcut: '52', text: 'Competitor mention → “Makes sense — want a side-by-side on deductible + ER exposure, not headline price?”' },
      { shortcut: '53', text: 'Need spouse → “When’s the best 10-minute window for you both — I’ll keep it tight.”' },
      { shortcut: '54', text: 'Wrong person → “Thanks for letting me know — who owns this policy on your side?”' },
    ],
    [
      { shortcut: '50', text: 'Remove me → “I’ll honor that — before I go, was it timing or message?”' },
      { shortcut: '51', text: 'Driving → “Got it — want a 10-second text link instead of talking now?”' },
      { shortcut: '52', text: 'Happy with current → “Love it — quick check: still the same renewal date we have on file?”' },
      { shortcut: '53', text: 'Skeptical → “Fair — I’ll send one page with no obligation; reply STOP anytime.”' },
      { shortcut: '54', text: 'Already renewed elsewhere → “Congrats — mind if I note the carrier so we don’t ping you again?”' },
    ],
  ]
  return {
    id: 'rebuttals',
    title: 'Rebuttals',
    items: sets[v]!,
  }
}

function buildFaqsPanel(h: number): SoundboardPanel {
  const v = h % 3
  const sets: SoundboardLine[][] = [
    [
      { shortcut: '!', text: 'Price → “Your premium depends on coverage tier, deductible, and discounts you qualify for.”' },
      { shortcut: '@', text: 'Coverage → “This includes ER, urgent care, and Rx — I can email a one-pager.”' },
      { shortcut: '#', text: 'Cancellation → “You can cancel anytime; I’ll read the effective date back to you.”' },
    ],
    [
      { shortcut: '!', text: 'Timeline → “Most reviews take under 10 minutes; we can pause anytime.”' },
      { shortcut: '@', text: 'Security → “We verify identity before any account changes — standard compliance.”' },
      { shortcut: '#', text: 'Fees → “No hidden fees on this path — I’ll itemize what you’d see on the first bill.”' },
    ],
    [
      { shortcut: '!', text: 'Discounts → “Bundles and safe-driver credits are the two biggest levers we see.”' },
      { shortcut: '@', text: 'Network → “Your doctor stays in-network on this plan tier — want me to confirm NPI?”' },
      { shortcut: '#', text: 'Claims → “Claims are filed online or by phone; average callback is under a business day.”' },
    ],
  ]
  return {
    id: 'faqs',
    title: 'FAQs',
    items: sets[v]!,
  }
}

function buildConversationFillersPanel(h: number): SoundboardPanel {
  const v = h % 2
  const base: SoundboardLine[] = [
    { shortcut: 'H', text: 'Hello / acknowledgment', tag: '[1]' },
    { shortcut: 'I', text: 'I understand', tag: '[1]' },
    { shortcut: 'P', text: 'Purpose of call' },
    { shortcut: 'V', text: 'Very busy — respect time', tag: '[1]' },
    { shortcut: 'Y', text: 'Yes / affirmation', tag: '[1]' },
  ]
  const extra: SoundboardLine[] =
    v === 0
      ? [
          { shortcut: 'L', text: 'Light humor / rapport', tag: '[1]' },
          { shortcut: 'S', text: 'Sympathy', tag: '[1]' },
          { shortcut: 'Z', text: 'Live person confirmation' },
        ]
      : [
          { shortcut: 'G', text: 'Gratitude', tag: '[1]' },
          { shortcut: 'F', text: 'From / attribution line', tag: '[1]' },
          { shortcut: 'W', text: 'Brief pause — take your time' },
        ]
  return {
    id: 'conversation',
    title: 'Conversation fillers',
    items: [...base, ...extra],
  }
}

function buildPageMessagesPanel(h: number): SoundboardPanel {
  const v = h % 2
  const items: SoundboardLine[] =
    v === 0
      ? [
          { shortcut: 'A', text: 'Ask — clarification prompt' },
          { shortcut: 'B', text: 'Busy — hold / callback' },
          { shortcut: 'C', text: 'Clarification' },
          { shortcut: 'E', text: 'Explanation' },
        ]
      : [
          { shortcut: 'A', text: 'Voicemail drop — permission + callback number' },
          { shortcut: 'B', text: 'Hold — “Still here — one more moment.”' },
          { shortcut: 'C', text: 'Transfer bridge — warm intro to specialist' },
        ]
  return {
    id: 'pageMessages',
    title: 'Page messages',
    items,
  }
}

function buildDtmfPanel(h: number): SoundboardPanel {
  const v = h % 2
  return {
    id: 'dtmf',
    title: 'DTMF',
    items:
      v === 0
        ? [
            { shortcut: '70', text: 'Press 0 — operator' },
            { shortcut: '71', text: 'Press 1 — confirm' },
            { shortcut: '72', text: 'Press 2 — decline' },
          ]
        : [
            { shortcut: '70', text: 'Press 1 — repeat offer' },
            { shortcut: '71', text: 'Press 9 — remove from list' },
          ],
  }
}

function buildClosingPanel(h: number, objective: string): SoundboardPanel {
  const v = h % 2
  const core = objective.slice(0, 90) + (objective.length > 90 ? '…' : '')
  return {
    id: 'closing',
    title: 'Closing',
    items:
      v === 0
        ? [
            { shortcut: '80', text: `Recap goal in one line: ${core || 'secure the next step.'}` },
            { shortcut: '81', text: 'Two-option close: “Tuesday 2pm or Thursday 10am — which fits?”' },
            { shortcut: '82', text: 'If hesitant: “What would need to be true to say yes today?”' },
          ]
        : [
            { shortcut: '80', text: 'Summary close: “So we’re aligned on X — the next step is Y. Sound right?”' },
            { shortcut: '81', text: 'Calendar hold: “I’ll send the invite while we’re on the phone.”' },
            { shortcut: '82', text: 'Soft exit: “No pressure — want the one-pager either way?”' },
          ],
  }
}

function buildDispositionsPanel(h: number): SoundboardPanel {
  const v = h % 2
  return {
    id: 'dispositions',
    title: 'Dispositions',
    items:
      v === 0
        ? [
            { shortcut: '90', text: 'Booked — meeting / renewal scheduled' },
            { shortcut: '91', text: 'Follow-up — callback time agreed' },
            { shortcut: '92', text: 'Not interested — polite exit' },
            { shortcut: '93', text: 'Wrong number / not the right party' },
          ]
        : [
            { shortcut: '90', text: 'Qualified — needs proposal' },
            { shortcut: '91', text: 'Voicemail — left message' },
            { shortcut: '92', text: 'DNC / opt-out requested' },
            { shortcut: '93', text: 'No answer' },
          ],
  }
}

function buildIntroPanel(
  description: string,
  audience: string,
  objective: string,
  tone: string,
  h: number,
  complexity: CallFlowComplexity,
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

  const full: SoundboardLine[] = [
    { shortcut: '0', text: lead },
    { shortcut: '1', text: branchGood },
    { shortcut: '2', text: branchRapport },
    { shortcut: '3', text: branchWho },
    { shortcut: '4', text: branchBad },
  ]

  return {
    id: 'intro',
    title: 'Introduction',
    items: complexity === 'basic' ? full.slice(0, 3) : full,
  }
}

function buildPitchPanel(
  description: string,
  objective: string,
  tone: string,
  h: number,
  complexity: CallFlowComplexity,
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

  const items: SoundboardLine[] =
    complexity === 'basic'
      ? [
          { shortcut: '10', text: core, tag: '[1]' },
          anchors[4]!,
          anchors[5]!,
        ]
      : [{ shortcut: '10', text: core, tag: '[1]' }, ...anchors]

  return {
    id: 'pitch',
    title: 'Pitch',
    items,
  }
}

function panelForSection(
  section: RegenerableSoundboardSection,
  input: GenerateSoundboardInput,
  h: number,
): SoundboardPanel {
  const { description, audience, objective, tone, complexity = 'advanced' } = input
  switch (section) {
    case 'intro':
      return buildIntroPanel(description, audience, objective, tone, h, complexity)
    case 'pitch':
      return buildPitchPanel(description, objective, tone, h, complexity)
    case 'rebuttals':
      return buildRebuttalsPanel(h)
    case 'faqs':
      return buildFaqsPanel(h)
    case 'conversation':
      return buildConversationFillersPanel(h)
    case 'pageMessages':
      return buildPageMessagesPanel(h)
    case 'closing':
      return buildClosingPanel(h, objective)
    case 'dispositions':
      return buildDispositionsPanel(h)
    case 'dtmf':
      return buildDtmfPanel(h)
    default:
      return buildIntroPanel(description, audience, objective, tone, h, complexity)
  }
}

/**
 * Mock “AI” soundboard: intro + pitch vary with brief; other panels use seeded demo copy.
 */
export function generateAgentSoundboard(input: GenerateSoundboardInput): AgentSoundboardBundle {
  const { description, audience, objective, tone, complexity = 'advanced', salt = '' } = input
  const h = hashSeed([description, audience, objective, tone, complexity, salt])

  return {
    generatedAt: new Date().toISOString(),
    intro: buildIntroPanel(description, audience, objective, tone, h, complexity),
    pitch: buildPitchPanel(description, objective, tone, h, complexity),
    rebuttals: buildRebuttalsPanel(h),
    faqs: buildFaqsPanel(h),
    conversation: buildConversationFillersPanel(h),
    pageMessages: buildPageMessagesPanel(h),
    dtmf: buildDtmfPanel(h),
    closing: buildClosingPanel(h, objective),
    dispositions: buildDispositionsPanel(h),
  }
}

/** Replace one section with a fresh seeded variant (demo). */
export function regenerateSoundboardSection(
  bundle: AgentSoundboardBundle,
  section: RegenerableSoundboardSection,
  input: GenerateSoundboardInput,
): AgentSoundboardBundle {
  const salt = `${bundle.generatedAt}-${section}-${Date.now()}-${Math.random()}`
  const h = hashSeed([
    input.description,
    input.audience,
    input.objective,
    input.tone,
    input.complexity ?? 'advanced',
    salt,
  ])
  return {
    ...bundle,
    [section]: panelForSection(section, input, h),
  }
}
