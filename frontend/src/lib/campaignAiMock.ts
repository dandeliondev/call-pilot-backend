/**
 * Deterministic “AI” campaign draft for demos — no network required.
 * Swap for real LLM when backend is ready.
 */
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
