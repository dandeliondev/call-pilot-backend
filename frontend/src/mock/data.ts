import type { CallReportRow, ScriptItem } from '../types/app'

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

export const callReports: CallReportRow[] = [
  {
    id: 'c1',
    agent: 'Sarah Chen',
    duration: '8:42',
    outcome: 'Booked',
    aiScore: 91,
    sentiment: 'Positive',
    transcript: `Agent: Hi Alex, this is Sarah from CallPilot Insurance.\nCustomer: Hi, I only have a minute.\nAgent: I'll be quick—did you get the quote we emailed?\nCustomer: Yes, it seemed high compared to my current plan.\nAgent: Totally fair. Are you comparing premium only, or total out-of-pocket if something happens?\nCustomer: Mostly premium.\nAgent: Got it. If we bundle renters and bump the deductible slightly, I can get you within $12 of your current monthly with better ER coverage. Want me to walk through it?\nCustomer: Okay, but keep it short.\nAgent: Here's the one-page summary…`,
  },
  {
    id: 'c2',
    agent: 'Marcus Lee',
    duration: '6:15',
    outcome: 'Follow-up',
    aiScore: 84,
    sentiment: 'Neutral',
    transcript: `Agent: Hey Jordan—Marcus from CallPilot.\nCustomer: I'm driving.\nAgent: I'll keep this tight. Quick question: still interested in the demo slot Thursday?\nCustomer: Maybe. What's the catch on pricing?\nAgent: No catch—it's seat-based, cancel anytime. Biggest cost is implementation hours if you want SSO day one.\nCustomer: Send me a one-pager. I'll look tonight.\nAgent: Will do in the next 10 minutes. Text okay?\nCustomer: Yes.`,
  },
  {
    id: 'c3',
    agent: 'Priya Sharma',
    duration: '12:03',
    outcome: 'Qualified',
    aiScore: 88,
    sentiment: 'Positive',
    transcript: `Agent: Morning Riley, Priya calling about your inbound lead form.\nCustomer: We already use a dialer.\nAgent: This layers coaching on top—think QA without listening to every call.\nCustomer: How does it know what "good" sounds like?\nAgent: You set rubrics and examples; the model scores empathy, clarity, compliance. Want a 12-minute live tour?\nCustomer: Tuesday 2pm works.`,
  },
  {
    id: 'c4',
    agent: 'John Doe',
    duration: '4:55',
    outcome: 'Declined',
    aiScore: 72,
    sentiment: 'Negative',
    transcript: `Agent: Hi—John from CallPilot wellness checks.\nCustomer: Remove me from your list.\nAgent: I can note that. Before I go, was our outreach off-timing or content?\nCustomer: Both. Stop calling.\nAgent: Understood. I'll add you to our do-not-contact list today.`,
  },
  {
    id: 'c5',
    agent: 'Elena Rossi',
    duration: '9:20',
    outcome: 'No answer',
    aiScore: 65,
    sentiment: 'Neutral',
    transcript: `Agent: (voicemail) Hi Sam, Elena from CallPilot—following up on your renewal window. I'll text a secure link; reply STOP anytime. Thanks!`,
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
  },
  {
    id: 's2',
    name: 'Inbound demo request',
    version: 2,
    performancePct: 71,
    snippet:
      'Qualify timeline and stakeholders in first 90 seconds; offer two concrete calendar slots.',
  },
  {
    id: 's3',
    name: 'Win-back — competitor mention',
    version: 3,
    performancePct: 66,
    snippet:
      'Acknowledge switching costs; compare total cost of ownership, not headline price.',
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
