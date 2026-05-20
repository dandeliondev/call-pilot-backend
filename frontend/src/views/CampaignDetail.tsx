import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SoundboardBundlePreview } from '../components/campaign/SoundboardBundlePreview'
import { Card } from '../components/ui/Card'
import { ChartContainer } from '../components/ui/ChartContainer'
import {
  agentsForCampaign,
  callsTrendForCampaign,
  metricsForCampaign,
} from '../lib/campaignMetrics'
import { callReports, initialScripts } from '../mock/data'
import { useCampaigns } from '../hooks/useCampaigns'
import {
  ALL_OUTCOMES,
  durationBucket,
  outcomeCounts,
  summarize,
} from '../lib/callReportUtils'
import type { CallReportRow, CampaignLifecycleState, ManagedCampaign } from '../types/app'
import { CallReports } from './CallReports'
import { CampaignSettingsTab } from './CampaignSettingsTab'

const STATUS_LABEL: Record<CampaignLifecycleState, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

const DUR_COLORS: Record<string, string> = {
  Short: '#fbbf24',
  Medium: '#38bdf8',
  Long: '#34d399',
}

const AVATAR_RING = [
  'bg-sky-600 text-white ring-2 ring-sky-600/30',
  'bg-violet-600 text-white ring-2 ring-violet-600/30',
  'bg-emerald-600 text-white ring-2 ring-emerald-600/30',
  'bg-amber-600 text-white ring-2 ring-amber-600/30',
  'bg-rose-600 text-white ring-2 ring-rose-600/30',
  'bg-indigo-600 text-white ring-2 ring-indigo-600/30',
] as const

function initialsFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]![0] ?? ''
    const b = parts[1]![0] ?? ''
    return `${a}${b}`.toUpperCase()
  }
  const single = parts[0] ?? '?'
  return single.slice(0, 2).toUpperCase()
}

function avatarPaletteClass(name: string, salt: number): string {
  let h = salt * 31
  for (let i = 0; i < name.length; i++) {
    h = (h + name.charCodeAt(i) * (i + 3)) % 1009
  }
  return AVATAR_RING[h % AVATAR_RING.length]!
}

function OverviewPeopleRow({
  title,
  people,
  salt,
}: {
  title: string
  people: { id: number; name: string }[]
  salt: number
}) {
  if (!people.length) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
        <p className="text-sm text-muted">None assigned.</p>
      </div>
    )
  }
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="flex flex-wrap gap-x-6 gap-y-4">
        {people.map(({ id, name }) => (
          <li key={id} className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${avatarPaletteClass(name, salt)}`}
              aria-hidden
            >
              {initialsFromDisplayName(name)}
            </span>
            <span className="text-sm font-medium leading-tight text-text">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type DetailTab =
  | 'overview'
  | 'calls'
  | 'performance'
  | 'ai'
  | 'agents'
  | 'scripts'
  | 'monitor'
  | 'settings'

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'calls', label: 'Calls' },
  { id: 'performance', label: 'Performance' },
  { id: 'ai', label: 'AI insights' },
  { id: 'agents', label: 'Team' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'monitor', label: 'Live monitor' },
  { id: 'settings', label: 'Settings' },
]

interface CampaignDetailProps {
  campaignId: string
  onBack: () => void
}

export function CampaignDetail({ campaignId, onBack }: CampaignDetailProps) {
  const campaigns = useCampaigns()
  const campaign = campaigns.find((c) => c.id === campaignId) ?? null
  const [tab, setTab] = useState<DetailTab>('overview')

  const rows = useMemo(
    () => callReports.filter((r) => r.campaignId === campaignId),
    [campaignId],
  )
  const metrics = useMemo(() => metricsForCampaign(campaignId), [campaignId])
  const trend = useMemo(() => callsTrendForCampaign(campaignId), [campaignId])

  if (!campaign) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={onBack} className="text-sm font-medium text-primary hover:underline">
          ← Campaigns
        </button>
        <Card title="Not found">This campaign may have been removed.</Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-sm font-medium text-primary hover:underline"
          >
            ← Campaign list
          </button>
          <h2 className="text-2xl font-semibold text-text">{campaign.name}</h2>
          <p className="text-sm text-muted line-clamp-2">{campaign.description}</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          {STATUS_LABEL[campaign.status]}
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-t-lg px-3 py-2 text-xs font-medium sm:text-sm ${
              tab === t.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <OverviewTab campaign={campaign} metrics={metrics} trend={trend} rows={rows} />
      )}
      {tab === 'calls' && <CallReports lockCampaignId={campaignId} />}
      {tab === 'performance' && <PerformanceTab rows={rows} />}
      {tab === 'ai' && <AiTab rows={rows} />}
      {tab === 'agents' && <AgentsTab campaignId={campaignId} campaign={campaign} rows={rows} />}
      {tab === 'scripts' && <ScriptsTab campaign={campaign} />}
      {tab === 'monitor' && <MonitorTab />}
      {tab === 'settings' && <CampaignSettingsTab campaign={campaign} />}
    </div>
  )
}

function OverviewTab({
  campaign,
  metrics,
  trend,
  rows,
}: {
  campaign: ManagedCampaign
  metrics: ReturnType<typeof metricsForCampaign>
  trend: { label: string; calls: number }[]
  rows: CallReportRow[]
}) {
  const alerts = useMemo(() => {
    const out: { level: 'warn' | 'crit'; text: string }[] = []
    if (metrics.callsMade > 0 && metrics.conversionPct < 12) {
      out.push({ level: 'crit', text: 'Conversion dropped vs benchmark — review script pricing block.' })
    }
    if (rows.some((r) => /expensive|price|cost/i.test(r.transcript)) && metrics.conversionPct < 20) {
      out.push({ level: 'warn', text: 'High price objection density today — consider ROI one-pager.' })
    }
    if (out.length === 0) {
      out.push({ level: 'warn', text: 'No critical alerts — volume within expected band (demo thresholds).' })
    }
    return out
  }, [metrics, rows])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Total calls</p>
          <p className="mt-2 text-3xl font-semibold text-text">{metrics.callsMade}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Conversion</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {metrics.callsMade ? `${metrics.conversionPct}%` : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Avg AI score</p>
          <p className="mt-2 text-3xl font-semibold text-text">
            {metrics.callsMade ? metrics.avgAiScore : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Schedule</p>
          <p className="mt-2 text-sm font-medium text-text">
            {campaign.scheduleStart
              ? new Date(campaign.scheduleStart).toLocaleString()
              : 'Not set'}
          </p>
          <p className="text-xs text-muted">{campaign.timezone}</p>
        </Card>
      </div>

      <Card title="Team" description="Campaign managers and agents on this campaign.">
        <div className="grid gap-8 sm:grid-cols-2">
          <OverviewPeopleRow
            title="Campaign managers"
            people={campaign.assignedCampaignManagers}
            salt={1}
          />
          <OverviewPeopleRow title="Agents" people={campaign.assignedAgents} salt={7} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Quick trend" description="Calls per day (mock data for this campaign).">
          {trend.length === 0 ? (
            <p className="text-sm text-muted">No calls yet for this campaign id in the demo dataset.</p>
          ) : (
            <ChartContainer title="Calls" height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </Card>
        <Card title="Alerts & notifications">
          <ul className="space-y-2 text-sm">
            {alerts.map((a, i) => (
              <li
                key={i}
                className={
                  a.level === 'crit'
                    ? 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-950'
                    : 'rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950'
                }
              >
                {a.text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Future: webhooks to Slack / email when thresholds breach.
          </p>
        </Card>
      </div>

      <Card title="Lead / contact source" description="Roadmap — CSV upload & CRM sync.">
        <p className="text-sm text-muted">
          Contacts for this campaign would appear here with ingest status. Demo uses shared mock transcripts only.
        </p>
      </Card>
    </div>
  )
}

function PerformanceTab({ rows }: { rows: CallReportRow[] }) {
  const outcomes = outcomeCounts(rows)
  const maxO = Math.max(1, ...ALL_OUTCOMES.map((o) => outcomes[o]))
  const stats = summarize(rows)

  const funnelData = useMemo(() => {
    const n = rows.length
    if (!n) {
      return [
        { name: 'Dialed', value: 0 },
        { name: 'Connected', value: 0 },
        { name: 'Converted', value: 0 },
      ]
    }
    const dialed = Math.round(n * 1.12)
    const booked = rows.filter((r) => r.outcome === 'Booked').length
    return [
      { name: 'Dialed', value: dialed },
      { name: 'Connected', value: n },
      { name: 'Converted', value: booked },
    ]
  }, [rows])

  const durBuckets = useMemo(() => {
    const m = { Short: 0, Medium: 0, Long: 0 }
    for (const r of rows) {
      m[durationBucket(r.durationSeconds)] += 1
    }
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Pipeline funnel" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} nameKey="name" isAnimationActive={false} />
            </FunnelChart>
          </ResponsiveContainer>
        </ChartContainer>
        <Card title="Duration distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={durBuckets} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72}>
                {durBuckets.map((e, i) => (
                  <Cell key={i} fill={DUR_COLORS[e.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-muted">
            Avg duration {stats.total ? `${Math.floor(stats.avgDurationSec / 60)}:${Math.round(stats.avgDurationSec % 60).toString().padStart(2, '0')}` : '—'}
          </p>
        </Card>
      </div>

      <Card title="Call outcomes" description="Counts for calls tied to this campaign in mock data.">
        <div className="flex h-44 items-end gap-2 border-b border-slate-200 pb-2">
          {ALL_OUTCOMES.map((o) => {
            const c = outcomes[o]
            const barPx = (c / maxO) * 140
            return (
              <div key={o} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold">{c}</span>
                <div className="flex h-[140px] w-full flex-col justify-end">
                  <div
                    className="w-full min-h-[4px] rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(barPx, c ? 8 : 0)}px` }}
                  />
                </div>
                <span className="line-clamp-2 text-center text-[10px] text-muted">{o}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function AiTab({ rows }: { rows: CallReportRow[] }) {
  const priceHits = rows.filter((r) => /price|expensive|premium|cost/i.test(r.transcript)).length
  const competitorHits = rows.filter((r) => /competitor|other carrier|switching/i.test(r.transcript)).length

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Top objections (transcript scan)">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Price / budget ({priceHits} calls mention pricing language)</li>
          <li>Need to discuss with spouse / partner</li>
          <li>Timing — renew later ({competitorHits} competitor mentions)</li>
        </ul>
      </Card>
      <Card title="Winning patterns">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Calls over 6 minutes correlate with higher AI scores in this slice.</li>
          <li>Positive sentiment when agent mirrors concern before numbers.</li>
        </ul>
      </Card>
      <Card title="AI recommendations" className="md:col-span-2">
        <ul className="space-y-2 text-sm">
          <li className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-violet-950">
            Price objection high — tighten value anchor before quote; add one ROI bullet.
          </li>
          <li className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sky-950">
            Shift 10% of volume to late afternoon blocks where sentiment skews positive.
          </li>
        </ul>
      </Card>
    </div>
  )
}

function AgentsTab({
  campaignId,
  campaign,
  rows,
}: {
  campaignId: string
  campaign: ManagedCampaign
  rows: CallReportRow[]
}) {
  const fromCalls = useMemo(() => {
    const map = new Map<string, { calls: number; booked: number; score: number }>()
    for (const r of rows) {
      const cur = map.get(r.agent) ?? { calls: 0, booked: 0, score: 0 }
      cur.calls += 1
      cur.score += r.aiScore
      if (r.outcome === 'Booked') cur.booked += 1
      map.set(r.agent, cur)
    }
    return [...map.entries()]
      .map(([agent, v]) => ({
        agent,
        calls: v.calls,
        convPct: v.calls ? Math.round((v.booked / v.calls) * 1000) / 10 : 0,
        avgAi: Math.round(v.score / v.calls),
      }))
      .sort((a, b) => b.convPct - a.convPct)
  }, [rows])

  const assignedNames = campaign.assignedAgents.map((a) => a.name)
  const leaderboard = fromCalls.length
    ? fromCalls
    : assignedNames.map((a) => ({ agent: a, calls: 0, convPct: 0, avgAi: 0 }))

  return (
    <div className="space-y-6">
      <Card title="Campaign managers" description="Edit in Settings — Resources.">
        <p className="text-sm text-text">
          {campaign.assignedCampaignManagers.map((m) => m.name).join(', ') || '—'}
        </p>
      </Card>
      <Card title="Assigned roster" description="Edit roster in Settings — Agents & dialing.">
        <p className="text-sm text-text">{assignedNames.join(', ') || '—'}</p>
      </Card>
      <Card title="Performance & leaderboard" description="Derived from mock calls for this campaign id.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">Agent</th>
                <th className="px-3 py-2 font-semibold">Calls</th>
                <th className="px-3 py-2 font-semibold">Conv.</th>
                <th className="px-3 py-2 font-semibold">Avg AI</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r, i) => (
                <tr key={r.agent} className="border-b border-border/80">
                  <td className="px-3 py-2 font-medium">{i + 1}</td>
                  <td className="px-3 py-2">{r.agent}</td>
                  <td className="px-3 py-2 tabular-nums">{r.calls}</td>
                  <td className="px-3 py-2 tabular-nums">{r.convPct}%</td>
                  <td className="px-3 py-2 tabular-nums">{r.avgAi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Agents also active in calls: {agentsForCampaign(campaignId).join(', ') || '—'}
        </p>
      </Card>
    </div>
  )
}

function ScriptsTab({ campaign }: { campaign: ManagedCampaign }) {
  const forCampaign = initialScripts.filter((s) => s.campaignId === campaign.id)

  return (
    <div className="space-y-6">
      {campaign.agentSoundboard && (
        <Card
          title="AI-generated script"
          description={`Edit in Settings — Scripts & call flow. Saved from the wizard or settings (demo). Generated ${new Date(campaign.agentSoundboard.generatedAt).toLocaleString()}.`}
        >
          <SoundboardBundlePreview bundle={campaign.agentSoundboard} />
        </Card>
      )}
      <Card
        title="Library scripts"
        description="Scripts linked from the global library. Configure primary, A/B, or AI call flow in Settings — Scripts & call flow."
      >
        {forCampaign.length === 0 ? (
          <p className="text-sm text-muted">No library scripts are linked to this campaign id yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-3 py-2 font-semibold">Script</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Ver</th>
                  <th className="px-3 py-2 font-semibold">Conversion</th>
                  <th className="px-3 py-2 font-semibold">Composite</th>
                  <th className="px-3 py-2 font-semibold">Snippet</th>
                </tr>
              </thead>
              <tbody>
                {forCampaign.map((s) => {
                  const role =
                    s.id === campaign.scriptId
                      ? 'Primary'
                      : campaign.abScriptId && s.id === campaign.abScriptId
                        ? 'A/B variant'
                        : 'Library'
                  return (
                    <tr key={s.id} className="border-b border-border/80">
                      <td className="px-3 py-2 font-medium text-text">{s.name}</td>
                      <td className="px-3 py-2 text-muted">{role}</td>
                      <td className="px-3 py-2 tabular-nums">v{s.version}</td>
                      <td className="px-3 py-2 tabular-nums">{s.conversionPct}%</td>
                      <td className="px-3 py-2 tabular-nums">{s.performancePct}%</td>
                      <td className="max-w-[min(28rem,55vw)] px-3 py-2 text-muted">
                        <span className="line-clamp-2">{s.snippet}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function MonitorTab() {
  const [pulse] = useState(() => [
    { agent: 'Sarah Chen', sentiment: 'Positive', outcome: 'Engaged' },
    { agent: 'Marcus Lee', sentiment: 'Neutral', outcome: 'Qualifying' },
  ])

  return (
    <div className="space-y-6">
      <Card
        title="Live monitoring (demo)"
        description="Simulated pulse — wire websockets / telephony events for production."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-900">Live calls</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-950">3</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-xs font-medium text-sky-900">Positive sentiment</p>
            <p className="mt-1 text-3xl font-semibold text-sky-950">61%</p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-xs font-medium text-violet-900">Booked (last hour)</p>
            <p className="mt-1 text-3xl font-semibold text-violet-950">4</p>
          </div>
        </div>
        <ul className="mt-6 space-y-2">
          {pulse.map((p, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{p.agent}</span>
              <span className="text-muted">
                {p.sentiment} · {p.outcome}
              </span>
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
