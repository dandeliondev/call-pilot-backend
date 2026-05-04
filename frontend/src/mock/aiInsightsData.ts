/** Mock analytics for the AI Insights page (replace with API data). */

export type InsightTrend = 'up' | 'down' | 'flat'

export type ActionableInsight = {
  id: string
  headline: string
  detail: string
}

export type ObjectionConversionRow = {
  objection: string
  sharePct: number
  conversionWhenPresentPct: number
  trend: InsightTrend
  /** pts vs portfolio avg conversion */
  conversionVsAvgPts: number
}

export type PatternLine = {
  id: string
  label: string
  impact: string
}

export type AgentInsightBlock = {
  name: string
  conversionPct: number
  callsHandled: number
  strengths: string[]
}

export type ObjectionDrillDown = {
  objection: string
  timingNote: string
  sampleSnippets: string[]
  suggestedFix: string
}

export const weeklySummaryDefault =
  'Overall performance improved ~12% vs prior week. Pricing objections remain the dominant friction point; friendly openings continue to correlate with the strongest closes. Shorten pitch segments after the two-minute mark to reduce silent drop-offs.'

export const weeklySummaryByCampaign: Record<string, string> = {
  'camp-renewal':
    'Renewal cohort: bundle language lifts booked outcomes when introduced before premium numbers. Price objections spike mid-call—lead with total cost of ownership.',
  'camp-demo':
    'Inbound demos: stakeholder clarity in the first 90 seconds predicts scheduling success. Trust objections convert better than price—keep security appendix handy.',
  'camp-winback':
    'Win-back: headline price comparisons hurt conversion; acknowledge switching costs early and use a worksheet before revisiting competitor pricing.',
}

export const actionableInsights: ActionableInsight[] = [
  {
    id: 'a1',
    headline: 'Price objection appears in 38% of calls',
    detail:
      'Introduce value framing and outcome anchors before stating dollar amounts — pilot reps saw fewer stalls after the first premium mention.',
  },
  {
    id: 'a2',
    headline: 'Friendly tone increases positive sentiment by ~22%',
    detail:
      'Standardize a permission-based opening and name-use in the first 20 seconds; sentiment lift correlates with longer qualified conversations.',
  },
  {
    id: 'a3',
    headline: 'Engagement drops after the 2-minute mark',
    detail:
      'Split pitch blocks under 25 seconds with check-in questions; monologue-heavy stretches align with hang-ups and voicemail callbacks.',
  },
]

export const objectionConversionCorrelation: ObjectionConversionRow[] = [
  {
    objection: 'Price',
    sharePct: 38,
    conversionWhenPresentPct: 12,
    trend: 'up',
    conversionVsAvgPts: -16,
  },
  {
    objection: 'Timing',
    sharePct: 22,
    conversionWhenPresentPct: 21,
    trend: 'flat',
    conversionVsAvgPts: -4,
  },
  {
    objection: 'Trust',
    sharePct: 18,
    conversionWhenPresentPct: 28,
    trend: 'down',
    conversionVsAvgPts: +6,
  },
  {
    objection: 'Features',
    sharePct: 14,
    conversionWhenPresentPct: 19,
    trend: 'flat',
    conversionVsAvgPts: -2,
  },
  {
    objection: 'Other',
    sharePct: 8,
    conversionWhenPresentPct: 17,
    trend: 'flat',
    conversionVsAvgPts: -5,
  },
]

export const winningPatterns: PatternLine[] = [
  { id: 'w1', label: 'Calls longer than 5 minutes', impact: '+30% conversion vs under 3 min' },
  { id: 'w2', label: 'Mentioning “bundle” before price', impact: '+18% success in renewal cohort' },
  { id: 'w3', label: 'Friendly / warm tone (opening)', impact: 'Highest close rate in blended QA rubric' },
]

export const riskPatterns: PatternLine[] = [
  { id: 'r1', label: 'Early price mention (< 45s)', impact: '−25% conversion vs value-first peers' },
  { id: 'r2', label: 'Agent monologues > 40 seconds', impact: 'Higher drop-off after second minute' },
  { id: 'r3', label: 'No explicit closing attempt', impact: 'Low bookings even when interest signals exist' },
]

export const agentSpotlight: AgentInsightBlock = {
  name: 'Sarah Chen',
  conversionPct: 31,
  callsHandled: 842,
  strengths: ['Friendly tone in first 20 seconds', 'Shorter permission intro', 'Strong two-option close'],
}

export const objectionTrend7d = [
  { day: 'Apr 27', price: 34, trust: 17 },
  { day: 'Apr 28', price: 35, trust: 18 },
  { day: 'Apr 29', price: 36, trust: 17 },
  { day: 'Apr 30', price: 37, trust: 18 },
  { day: 'May 1', price: 38, trust: 18 },
  { day: 'May 2', price: 38, trust: 19 },
  { day: 'May 3', price: 39, trust: 18 },
]

export const sentimentTrend7d = [
  { day: 'Apr 27', positive: 41 },
  { day: 'Apr 28', positive: 42 },
  { day: 'Apr 29', positive: 43 },
  { day: 'Apr 30', positive: 43 },
  { day: 'May 1', positive: 44 },
  { day: 'May 2', positive: 44 },
  { day: 'May 3', positive: 45 },
]

export const conversionTrend7d = [
  { day: 'Apr 27', rate: 21 },
  { day: 'Apr 28', rate: 21.5 },
  { day: 'Apr 29', rate: 22 },
  { day: 'Apr 30', rate: 22 },
  { day: 'May 1', rate: 23 },
  { day: 'May 2', rate: 23.5 },
  { day: 'May 3', rate: 24 },
]

export const drillDownByObjection: Record<string, ObjectionDrillDown> = {
  Price: {
    objection: 'Price',
    timingNote:
      'Typically surfaces 45–120 seconds in, immediately after the first premium anchor or when competitors are named.',
    sampleSnippets: [
      'Customer: “It seemed high compared to my current plan.”',
      'Customer: “What’s the catch on pricing?”',
      'Customer: “Your price is higher than [Competitor].”',
    ],
    suggestedFix:
      'Reorder script: confirm goals → quantify avoided risk → bundle/deductible lever → then dollars. Add one-page TCO snapshot.',
  },
  Timing: {
    objection: 'Timing',
    timingNote: 'Clusters around busy periods and end-of-quarter pushes; often used as soft stall.',
    sampleSnippets: [
      'Customer: “Call me next week.”',
      'Customer: “I only have a minute.”',
    ],
    suggestedFix:
      'Offer two concrete slots while on the phone; pair with SMS calendar hold and shorten discovery to respect time claim.',
  },
  Trust: {
    objection: 'Trust',
    timingNote: 'Often follows security, compliance, or first-time vendor questions.',
    sampleSnippets: [
      'Customer: “How do I know this isn’t a bait-and-switch?”',
      'Customer: “We already use a dialer.”',
    ],
    suggestedFix:
      'Lead with reference customers + SSO/audit appendix; avoid debating features until credibility box is checked.',
  },
  Features: {
    objection: 'Features',
    timingNote: 'Appears mid-discovery when mapping to existing stack.',
    sampleSnippets: ['Customer: “Does it integrate with Salesforce?”'],
    suggestedFix: 'Use a capability checklist aligned to their stated jobs-to-be-done before expanding roadmap.',
  },
  Other: {
    objection: 'Other',
    timingNote: 'Catch-all stalls — spouse approval, legal, procurement.',
    sampleSnippets: ['Customer: “I need to run this by my partner.”'],
    suggestedFix: 'Capture decision criteria + timeline; book a joint follow-up with materials tailored to blockers.',
  },
}

export const callReportCampaignsFilter = [
  { id: '', label: 'All campaigns' },
  { id: 'camp-renewal', label: 'Outbound renewal — warm intro' },
  { id: 'camp-demo', label: 'Inbound demo request' },
  { id: 'camp-winback', label: 'Win-back — competitor mention' },
]

export const agentFilterOptions = [
  { id: '', label: 'All agents' },
  { id: 'Sarah Chen', label: 'Sarah Chen' },
  { id: 'Marcus Lee', label: 'Marcus Lee' },
  { id: 'Priya Sharma', label: 'Priya Sharma' },
  { id: 'John Doe', label: 'John Doe' },
  { id: 'Elena Rossi', label: 'Elena Rossi' },
]

export const timeRangeOptions = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
]
