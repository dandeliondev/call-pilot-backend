import type { CallCampaignRef, CallReportRow, ScriptItem } from '../types/app'

export const callReportCampaigns: CallCampaignRef[] = [
  { id: 'camp-renewal', name: 'Outbound renewal — warm intro' },
  { id: 'camp-demo', name: 'Inbound demo request' },
  { id: 'camp-winback', name: 'Win-back — competitor mention' },
]

export const dashboardMetrics = {
  totalCalls: 12480,
  activeCampaigns: 12,
  avgAiScore: 86,
  conversionRate: 24.5,
} as const

export const callsTrend = [
  { day: 'Mon', calls: 420 },
  { day: 'Tue', calls: 510 },
  { day: 'Wed', calls: 480 },
  { day: 'Thu', calls: 620 },
  { day: 'Fri', calls: 590 },
  { day: 'Sat', calls: 310 },
  { day: 'Sun', calls: 280 },
]

/** Answered vs unanswered, drops, voicemail — share of all dial attempts */
export const callOutcomeBreakdown = [
  { name: 'Answered', value: 5820 },
  { name: 'Unanswered', value: 3120 },
  { name: 'Dropped', value: 2180 },
  { name: 'Voicemail', value: 1360 },
] as const

/** Full funnel from dial to conversion (illustrative) */
export const conversionFunnel = [
  { name: 'Dialed', value: 12480 },
  { name: 'Connected', value: 8940 },
  { name: 'Engaged (90s+)', value: 4210 },
  { name: 'Qualified lead', value: 1890 },
  { name: 'Converted', value: 612 },
] as const

/** Per-script performance for dashboard comparison */
export const scriptEffectiveness = [
  {
    script: 'Renewal — warm intro',
    conversionPct: 28.4,
    avgScore: 88,
    avgDurationMin: 7.2,
  },
  {
    script: 'Inbound demo',
    conversionPct: 22.1,
    avgScore: 84,
    avgDurationMin: 6.4,
  },
  {
    script: 'Win-back',
    conversionPct: 19.6,
    avgScore: 81,
    avgDurationMin: 5.9,
  },
] as const

/** Rows = hours (label), cols = Mon–Sun; values 0–100 relative connect quality */
export const peakCallingHeatmap = {
  hourLabels: ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm'] as const,
  dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const,
  /** [hourIndex][dayIndex] */
  values: [
    [42, 48, 45, 50, 46, 28, 22],
    [55, 58, 52, 60, 56, 32, 26],
    [62, 65, 63, 68, 64, 38, 30],
    [58, 62, 60, 66, 61, 35, 28],
    [52, 55, 53, 58, 54, 40, 32],
    [48, 50, 49, 54, 50, 36, 30],
    [58, 62, 60, 72, 68, 44, 34],
    [72, 76, 74, 85, 80, 48, 38],
    [78, 82, 80, 88, 84, 52, 42],
    [70, 74, 72, 80, 76, 46, 36],
    [52, 56, 54, 62, 58, 38, 30],
    [38, 42, 40, 46, 42, 28, 22],
  ] as const,
} as const

export type AiRecommendationItem = {
  id: string
  headline: string
  detail: string
  tag: 'timing' | 'script' | 'risk' | 'ops'
}

export const aiRecommendations: AiRecommendationItem[] = [
  {
    id: 'r1',
    headline: 'Calls convert 27% more often between 3pm–5pm local time.',
    detail: 'Shift more outbound volume into this window for renewal campaigns.',
    tag: 'timing',
  },
  {
    id: 'r2',
    headline: 'Script variation #2 lifts engagement by ~18% vs baseline.',
    detail: 'The shorter qualification block in the first 90 seconds correlates with longer talks.',
    tag: 'script',
  },
  {
    id: 'r3',
    headline: 'Pricing objections cluster on Thursday afternoons.',
    detail: 'Pair reps with a one-page ROI anchor before the pitch on Thu blocks.',
    tag: 'risk',
  },
]

export const callReports: CallReportRow[] = [
  {
    id: 'c1',
    agent: 'Sarah Chen',
    duration: '8:42',
    durationSeconds: 522,
    outcome: 'Booked',
    aiScore: 91,
    sentiment: 'Positive',
    campaignId: 'camp-renewal',
    campaignName: 'Outbound renewal — warm intro',
    startedAt: '2026-05-01T15:20:00Z',
    tags: ['Hot lead'],
    transcript: `Agent: Hi Alex, this is Sarah from CallPilot Insurance.\nCustomer: Hi, I only have a minute.\nAgent: I'll be quick—did you get the quote we emailed?\nCustomer: Yes, it seemed high compared to my current plan.\nAgent: Totally fair. Are you comparing premium only, or total out-of-pocket if something happens?\nCustomer: Mostly premium.\nAgent: Got it. If we bundle renters and bump the deductible slightly, I can get you within $12 of your current monthly with better ER coverage. Want me to walk through it?\nCustomer: Okay, but keep it short.\nAgent: Here's the one-page summary…`,
  },
  {
    id: 'c2',
    agent: 'Marcus Lee',
    duration: '6:15',
    durationSeconds: 375,
    outcome: 'Follow-up',
    aiScore: 84,
    sentiment: 'Neutral',
    campaignId: 'camp-demo',
    campaignName: 'Inbound demo request',
    startedAt: '2026-05-02T10:05:00Z',
    tags: ['Needs callback'],
    transcript: `Agent: Hey Jordan—Marcus from CallPilot.\nCustomer: I'm driving.\nAgent: I'll keep this tight. Quick question: still interested in the demo slot Thursday?\nCustomer: Maybe. What's the catch on pricing?\nAgent: No catch—it's seat-based, cancel anytime. Biggest cost is implementation hours if you want SSO day one.\nCustomer: Send me a one-pager. I'll look tonight.\nAgent: Will do in the next 10 minutes. Text okay?\nCustomer: Yes.`,
  },
  {
    id: 'c3',
    agent: 'Priya Sharma',
    duration: '12:03',
    durationSeconds: 723,
    outcome: 'Qualified',
    aiScore: 88,
    sentiment: 'Positive',
    campaignId: 'camp-demo',
    campaignName: 'Inbound demo request',
    startedAt: '2026-04-28T14:40:00Z',
    tags: ['Hot lead'],
    transcript: `Agent: Morning Riley, Priya calling about your inbound lead form.\nCustomer: We already use a dialer.\nAgent: This layers coaching on top—think QA without listening to every call.\nCustomer: How does it know what "good" sounds like?\nAgent: You set rubrics and examples; the model scores empathy, clarity, compliance. Want a 12-minute live tour?\nCustomer: Tuesday 2pm works.`,
  },
  {
    id: 'c4',
    agent: 'John Doe',
    duration: '4:55',
    durationSeconds: 295,
    outcome: 'Declined',
    aiScore: 72,
    sentiment: 'Negative',
    campaignId: 'camp-winback',
    campaignName: 'Win-back — competitor mention',
    startedAt: '2026-04-30T09:15:00Z',
    tags: [],
    transcript: `Agent: Hi—John from CallPilot wellness checks.\nCustomer: Remove me from your list.\nAgent: I can note that. Before I go, was our outreach off-timing or content?\nCustomer: Both. Stop calling.\nAgent: Understood. I'll add you to our do-not-contact list today.`,
  },
  {
    id: 'c5',
    agent: 'Elena Rossi',
    duration: '9:20',
    durationSeconds: 560,
    outcome: 'No answer',
    aiScore: 65,
    sentiment: 'Neutral',
    campaignId: 'camp-renewal',
    campaignName: 'Outbound renewal — warm intro',
    startedAt: '2026-04-29T16:00:00Z',
    tags: ['Needs callback'],
    transcript: `Agent: (voicemail) Hi Sam, Elena from CallPilot—following up on your renewal window. I'll text a secure link; reply STOP anytime. Thanks!`,
  },
  {
    id: 'c6',
    agent: 'Sarah Chen',
    duration: '0:38',
    durationSeconds: 38,
    outcome: 'Declined',
    aiScore: 58,
    sentiment: 'Negative',
    campaignId: 'camp-winback',
    campaignName: 'Win-back — competitor mention',
    startedAt: '2026-04-27T11:22:00Z',
    tags: ['Wrong number'],
    transcript: `Agent: Hi, this is Sarah from CallPilot—\nCustomer: You have the wrong person. Goodbye.`,
  },
  {
    id: 'c7',
    agent: 'Marcus Lee',
    duration: '11:40',
    durationSeconds: 700,
    outcome: 'Booked',
    aiScore: 93,
    sentiment: 'Positive',
    campaignId: 'camp-demo',
    campaignName: 'Inbound demo request',
    startedAt: '2026-05-03T13:10:00Z',
    tags: ['Hot lead'],
    transcript: `Agent: Marcus from CallPilot — you requested pricing for the enterprise bundle.\nCustomer: Yes, we need SSO and audit logs.\nAgent: Perfect. I'll send the order form with line items; we can start onboarding Monday.\nCustomer: Send it today.`,
  },
  {
    id: 'c8',
    agent: 'Priya Sharma',
    duration: '2:10',
    durationSeconds: 130,
    outcome: 'Follow-up',
    aiScore: 68,
    sentiment: 'Neutral',
    campaignId: 'camp-renewal',
    campaignName: 'Outbound renewal — warm intro',
    startedAt: '2026-04-26T08:45:00Z',
    tags: ['Needs callback'],
    transcript: `Agent: Priya from CallPilot—quick renewal check-in.\nCustomer: Too expensive, email me.\nAgent: I can—what budget range would make this a yes?\nCustomer: Just email.`,
  },
  {
    id: 'c9',
    agent: 'John Doe',
    duration: '7:02',
    durationSeconds: 422,
    outcome: 'Qualified',
    aiScore: 79,
    sentiment: 'Positive',
    campaignId: 'camp-winback',
    campaignName: 'Win-back — competitor mention',
    startedAt: '2026-05-02T17:30:00Z',
    tags: [],
    transcript: `Agent: John calling about your competitor switch promotion.\nCustomer: We're interested but need legal to review.\nAgent: I'll send the standard MSA and security appendix.\nCustomer: Good — expect feedback Friday.`,
  },
  {
    id: 'c10',
    agent: 'Elena Rossi',
    duration: '1:05',
    durationSeconds: 65,
    outcome: 'Declined',
    aiScore: 62,
    sentiment: 'Negative',
    campaignId: 'camp-renewal',
    campaignName: 'Outbound renewal — warm intro',
    startedAt: '2026-04-25T19:05:00Z',
    tags: [],
    transcript: `Customer: Not interested.\nAgent: Understood — may I ask what drove that?\nCustomer: Stop calling.`,
  },
  {
    id: 'c11',
    agent: 'Sarah Chen',
    duration: '5:30',
    durationSeconds: 330,
    outcome: 'Follow-up',
    aiScore: 81,
    sentiment: 'Neutral',
    campaignId: 'camp-renewal',
    campaignName: 'Outbound renewal — warm intro',
    startedAt: '2026-05-01T20:00:00Z',
    tags: ['Needs callback'],
    transcript: `Agent: Sarah following up on the quote.\nCustomer: Still comparing. Call me next week.\nAgent: Tuesday or Wednesday better?\nCustomer: Tuesday afternoon.`,
  },
  {
    id: 'c12',
    agent: 'Marcus Lee',
    duration: '0:45',
    durationSeconds: 45,
    outcome: 'No answer',
    aiScore: 55,
    sentiment: 'Neutral',
    campaignId: 'camp-demo',
    campaignName: 'Inbound demo request',
    startedAt: '2026-04-24T12:00:00Z',
    tags: [],
    transcript: `Agent: (voicemail) Marcus from CallPilot — returning your demo request. Callback at this number.`,
  },
  {
    id: 'c13',
    agent: 'Priya Sharma',
    duration: '15:20',
    durationSeconds: 920,
    outcome: 'Booked',
    aiScore: 89,
    sentiment: 'Positive',
    campaignId: 'camp-demo',
    campaignName: 'Inbound demo request',
    startedAt: '2026-04-23T10:00:00Z',
    tags: ['Hot lead'],
    transcript: `Long discovery call — stakeholder alignment achieved; pilot signed for next month.`,
  },
  {
    id: 'c14',
    agent: 'John Doe',
    duration: '3:18',
    durationSeconds: 198,
    outcome: 'Declined',
    aiScore: 71,
    sentiment: 'Negative',
    campaignId: 'camp-winback',
    campaignName: 'Win-back — competitor mention',
    startedAt: '2026-05-03T09:00:00Z',
    tags: [],
    transcript: `Customer: Your price is higher than [Competitor].\nAgent: Let me compare coverage apples-to-apples.\nCustomer: Not today.`,
  },
]

export const initialScripts: ScriptItem[] = [
  {
    id: 's1',
    name: 'Outbound renewal — warm intro',
    version: 3,
    performancePct: 78,
    snippet:
      'Open with permission, confirm identity, anchor value before price, offer bundle alternative.',
    conversionPct: 28.4,
    avgDurationMin: 7.2,
    sentimentScore: 84,
    outcomeBreakdown: {
      Booked: 42,
      'Follow-up': 28,
      Qualified: 18,
      Declined: 14,
      'No answer': 12,
    },
    funnel: {
      dialed: 2840,
      connected: 2190,
      qualified: 612,
      converted: 806,
    },
    aiFeedback:
      'Customers respond well to the value-first framing in opening and qualification, but drop-off increases sharply once premium numbers are introduced—consider anchoring total cost of ownership before the dollar amount.',
    tags: ['Retention', 'Sales'],
    sections: [
      {
        id: 'open',
        title: 'Opening',
        body: 'Permission-based intro; confirm identity and renewal window; promise time-bound conversation.',
      },
      {
        id: 'qual',
        title: 'Qualification',
        body: 'Confirm current carrier, renewal date, and what “too expensive” means (premium vs coverage).',
      },
      {
        id: 'pitch',
        title: 'Pitch',
        body: 'Bundle renters + deductible tweak narrative; one-page summary reference.',
        weak: 'dropoff',
      },
      {
        id: 'obj',
        title: 'Objection handling',
        body: 'Price objections → bridge to ER/out-of-pocket scenarios; avoid debating premium alone.',
        weak: 'objection',
      },
      {
        id: 'close',
        title: 'Closing',
        body: 'Two-option close: adjust deductible vs adjust bundle; schedule callback if not ready.',
      },
    ],
    versionHistory: [
      {
        version: 1,
        conversionPct: 18.2,
        avgDurationMin: 8.4,
        aiScore: 79,
        engagementPct: 61,
      },
      {
        version: 2,
        conversionPct: 23.1,
        avgDurationMin: 7.8,
        aiScore: 82,
        engagementPct: 68,
      },
      {
        version: 3,
        conversionPct: 28.4,
        avgDurationMin: 7.2,
        aiScore: 87,
        engagementPct: 74,
      },
    ],
    performanceTrend: [
      { day: 'Apr 27', value: 71 },
      { day: 'Apr 28', value: 73 },
      { day: 'Apr 29', value: 74 },
      { day: 'Apr 30', value: 76 },
      { day: 'May 1', value: 77 },
      { day: 'May 2', value: 78 },
      { day: 'May 3', value: 79 },
    ],
  },
  {
    id: 's2',
    name: 'Inbound demo request',
    version: 2,
    performancePct: 71,
    snippet:
      'Qualify timeline and stakeholders in first 90 seconds; offer two concrete calendar slots.',
    conversionPct: 22.1,
    avgDurationMin: 6.4,
    sentimentScore: 80,
    outcomeBreakdown: {
      Booked: 31,
      'Follow-up': 36,
      Qualified: 22,
      Declined: 11,
      'No answer': 18,
    },
    funnel: {
      dialed: 1520,
      connected: 1180,
      qualified: 398,
      converted: 336,
    },
    aiFeedback:
      'Strong rapport when reps mirror stakeholder language, but several losses trace to vague next steps—tighten the double-slot calendar close and repeat back the customer’s success metric before pitching features.',
    tags: ['Sales', 'Upsell'],
    sections: [
      {
        id: 'open',
        title: 'Opening',
        body: 'Thank them for inbound interest; confirm company size and primary pain in two questions.',
      },
      {
        id: 'qual',
        title: 'Qualification',
        body: 'Decision timeline, technical stakeholders, must-have integrations—all inside 90 seconds.',
      },
      {
        id: 'pitch',
        title: 'Pitch',
        body: 'Outcome-led tour: QA coverage without listening fatigue; rubrics and coaching loops.',
      },
      {
        id: 'obj',
        title: 'Objection handling',
        body: 'Budget → pilot scope; security → SSO appendix; competitor → differentiation on coaching layer.',
      },
      {
        id: 'close',
        title: 'Closing',
        body: 'Offer Tue/Thu slots in their timezone; send invite while on the phone.',
        weak: 'dropoff',
      },
    ],
    versionHistory: [
      {
        version: 1,
        conversionPct: 17.5,
        avgDurationMin: 7.1,
        aiScore: 76,
        engagementPct: 63,
      },
      {
        version: 2,
        conversionPct: 22.1,
        avgDurationMin: 6.4,
        aiScore: 83,
        engagementPct: 71,
      },
    ],
    performanceTrend: [
      { day: 'Apr 27', value: 66 },
      { day: 'Apr 28', value: 67 },
      { day: 'Apr 29', value: 68 },
      { day: 'Apr 30', value: 69 },
      { day: 'May 1', value: 70 },
      { day: 'May 2', value: 71 },
      { day: 'May 3', value: 71 },
    ],
  },
  {
    id: 's3',
    name: 'Win-back — competitor mention',
    version: 3,
    performancePct: 66,
    snippet:
      'Acknowledge switching costs; compare total cost of ownership, not headline price.',
    conversionPct: 19.6,
    avgDurationMin: 5.9,
    sentimentScore: 74,
    outcomeBreakdown: {
      Booked: 24,
      'Follow-up': 22,
      Qualified: 14,
      Declined: 26,
      'No answer': 20,
    },
    funnel: {
      dialed: 980,
      connected: 710,
      qualified: 178,
      converted: 192,
    },
    aiFeedback:
      'Win-back wins when switching friction is acknowledged early; objection spikes cluster on headline price—lead with total cost of ownership and a side-by-side worksheet before revisiting competitor headlines.',
    tags: ['Retention', 'Sales'],
    sections: [
      {
        id: 'open',
        title: 'Opening',
        body: 'Acknowledge departure honestly; ask permission to revisit one comparison on total cost.',
      },
      {
        id: 'qual',
        title: 'Qualification',
        body: 'What changed since leaving—coverage gap, service, or pure budget?',
      },
      {
        id: 'pitch',
        title: 'Pitch',
        body: 'Two-column narrative: switching costs vs uncovered exposure scenarios.',
        weak: 'objection',
      },
      {
        id: 'obj',
        title: 'Objection handling',
        body: '“Too expensive” → deductible + ER story; competitor mention → apples-to-apples worksheet.',
      },
      {
        id: 'close',
        title: 'Closing',
        body: 'Pilot or reinstatement path with clear rollback and timeline.',
      },
    ],
    versionHistory: [
      {
        version: 1,
        conversionPct: 14.1,
        avgDurationMin: 6.8,
        aiScore: 72,
        engagementPct: 58,
      },
      {
        version: 2,
        conversionPct: 17.3,
        avgDurationMin: 6.2,
        aiScore: 75,
        engagementPct: 62,
      },
      {
        version: 3,
        conversionPct: 19.6,
        avgDurationMin: 5.9,
        aiScore: 78,
        engagementPct: 66,
      },
    ],
    performanceTrend: [
      { day: 'Apr 27', value: 61 },
      { day: 'Apr 28', value: 62 },
      { day: 'Apr 29', value: 63 },
      { day: 'Apr 30', value: 64 },
      { day: 'May 1', value: 65 },
      { day: 'May 2', value: 65 },
      { day: 'May 3', value: 66 },
    ],
  },
]

export const objectionShare = [
  { name: 'Price', value: 38 },
  { name: 'Timing', value: 22 },
  { name: 'Trust', value: 18 },
  { name: 'Features', value: 14 },
  { name: 'Other', value: 8 },
]

export const agentCustomer = {
  name: 'Alex Rivera',
  script:
    "Hi Alex — thanks for taking the call. I'll keep this under five minutes. I'm reaching out because you asked about reducing premium without losing ER coverage. Before I walk through options, does that still match what you're solving for?",
}
