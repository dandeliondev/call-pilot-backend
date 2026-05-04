import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  FunnelChart,
  Funnel,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { ChartContainer } from '../components/ui/ChartContainer'
import {
  callReportCampaigns,
  callReports,
  conversionFunnel,
  initialScripts,
  scriptEffectiveness,
} from '../mock/data'
import type { ReportsMenuId } from '../types/app'
import { CallReports } from './CallReports'

const PIE_COLORS = ['#3b82f6', '#6366f1', '#94a3b8', '#f59e0b', '#22c55e']

function ConversionReport() {
  const outcomes = [
    { name: 'Booked', rate: 24 },
    { name: 'Qualified', rate: 18 },
    { name: 'Follow-up', rate: 31 },
    { name: 'Declined', rate: 14 },
    { name: 'No answer', rate: 13 },
  ]
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Portfolio conversion mix from filtered mock analytics — wire to your warehouse for live numbers.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Portfolio conversion</p>
          <p className="mt-2 text-3xl font-semibold text-primary">24.5%</p>
          <p className="mt-1 text-xs text-muted">Booked ÷ connected (demo)</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Qualified → Booked</p>
          <p className="mt-2 text-3xl font-semibold text-text">32%</p>
          <p className="mt-1 text-xs text-muted">Of qualified conversations</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Avg cycle (won)</p>
          <p className="mt-2 text-3xl font-semibold text-text">4.2d</p>
          <p className="mt-1 text-xs text-muted">Mock latency to booking</p>
        </Card>
      </div>
      <ChartContainer title="Outcome conversion rates (mock)" height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={outcomes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
            <Tooltip />
            <Bar dataKey="rate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

function AgentPerformanceReport() {
  const agentMap = new Map<
    string,
    { calls: number; convSum: number; scoreSum: number; n: number }
  >()
  for (const r of callReports) {
    const cur = agentMap.get(r.agent) ?? { calls: 0, convSum: 0, scoreSum: 0, n: 0 }
    cur.calls += 1
    cur.scoreSum += r.aiScore
    cur.n += 1
    if (r.outcome === 'Booked') cur.convSum += 1
    agentMap.set(r.agent, cur)
  }
  const rows = [...agentMap.entries()].map(([agent, v]) => ({
    agent,
    calls: v.calls,
    conversionPct: v.calls ? Math.round((v.convSum / v.calls) * 1000) / 10 : 0,
    avgAiScore: v.n ? Math.round(v.scoreSum / v.n) : 0,
  }))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Aggregated from mock call rows — same dataset as Calls report filters.
      </p>
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Calls</th>
                <th className="px-4 py-3 font-semibold">Conv. (booked)</th>
                <th className="px-4 py-3 font-semibold">Avg AI score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.agent} className="border-b border-border/80">
                  <td className="px-4 py-3 font-medium">{row.agent}</td>
                  <td className="px-4 py-3 tabular-nums">{row.calls}</td>
                  <td className="px-4 py-3 tabular-nums">{row.conversionPct}%</td>
                  <td className="px-4 py-3 tabular-nums">{row.avgAiScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <ChartContainer title="Calls per agent (mock)" height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 8, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis type="category" dataKey="agent" tick={{ fill: '#64748b', fontSize: 11 }} width={76} />
            <Tooltip />
            <Bar dataKey="calls" fill="#6366f1" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

function ScriptsReport() {
  const campaignName = (id: string) =>
    callReportCampaigns.find((c) => c.id === id)?.name ?? id
  const rows = initialScripts.map((s) => ({
    id: s.id,
    name: s.name,
    version: s.version,
    performancePct: s.performancePct,
    conversionPct: s.conversionPct,
    avgDurationMin: s.avgDurationMin,
    campaign: campaignName(s.campaignId),
  }))
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Script analytics (mock) — edit scripts in Script Management; this view is read-only performance.
      </p>
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-3 font-semibold">Script</th>
                <th className="px-4 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 font-semibold">Ver</th>
                <th className="px-4 py-3 font-semibold">Composite</th>
                <th className="px-4 py-3 font-semibold">Conversion</th>
                <th className="px-4 py-3 font-semibold">Avg dur.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/80">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-muted">{row.campaign}</td>
                  <td className="px-4 py-3">v{row.version}</td>
                  <td className="px-4 py-3 tabular-nums">{row.performancePct}%</td>
                  <td className="px-4 py-3 tabular-nums text-primary">{row.conversionPct}%</td>
                  <td className="px-4 py-3 tabular-nums">{row.avgDurationMin} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <ChartContainer title="Conversion % by script focus" height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} angle={-15} textAnchor="end" height={70} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="conversionPct" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

function CampaignsReport() {
  const map = new Map<string, { calls: number; booked: number }>()
  for (const r of callReports) {
    const cur = map.get(r.campaignName) ?? { calls: 0, booked: 0 }
    cur.calls += 1
    if (r.outcome === 'Booked') cur.booked += 1
    map.set(r.campaignName, cur)
  }
  const rows = [...map.entries()].map(([campaign, v]) => ({
    campaign,
    calls: v.calls,
    conversionPct: v.calls ? Math.round((v.booked / v.calls) * 1000) / 10 : 0,
  }))
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Call volume and booked conversion by campaign (mock dial outcomes).
      </p>
      <ChartContainer title="Calls by campaign" height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="campaign" tick={{ fill: '#64748b', fontSize: 9 }} angle={-18} textAnchor="end" height={76} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="calls" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartContainer title="Booked conversion % by campaign" height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="campaign" tick={{ fill: '#64748b', fontSize: 9 }} angle={-18} textAnchor="end" height={76} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
            <Tooltip />
            <Bar dataKey="conversionPct" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

function FunnelReport() {
  const funnelData = conversionFunnel.map((x) => ({
    name: x.name,
    value: x.value,
  }))
  const scriptLines = scriptEffectiveness.map((s) => ({
    script: s.script.slice(0, 22),
    conversionPct: s.conversionPct,
  }))
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Pipeline funnel and script-level conversion contribution (illustrative).
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Pipeline funnel" description="Dial → convert (mock volumes)" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} nameKey="name" isAnimationActive={false} />
            </FunnelChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Conversion by script focus" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scriptLines} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="script" tick={{ fill: '#64748b', fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="conversionPct" stroke="#3b82f6" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}

function SentimentReport() {
  const counts = { Positive: 0, Neutral: 0, Negative: 0 }
  for (const r of callReports) {
    counts[r.sentiment] += 1
  }
  const pieData = (['Positive', 'Neutral', 'Negative'] as const).map((name) => ({
    name,
    value: counts[name],
  }))
  const total = pieData.reduce((s, x) => s + x.value, 0)
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Sentiment distribution across the mock call dataset (same rows as Calls).
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Sentiment share" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={88}
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <Card>
          <p className="text-sm font-medium text-text">Summary</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {pieData.map((row) => (
              <li key={row.name} className="flex justify-between gap-4">
                <span>{row.name}</span>
                <span className="font-medium text-text">
                  {row.value} ({total ? Math.round((row.value / total) * 100) : 0}%)
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

interface ReportsHubProps {
  menuId: ReportsMenuId
}

export function ReportsHub({ menuId }: ReportsHubProps) {
  switch (menuId) {
    case 'calls':
      return <CallReports />
    case 'conversion':
      return <ConversionReport />
    case 'agents':
      return <AgentPerformanceReport />
    case 'scripts':
      return <ScriptsReport />
    case 'campaigns':
      return <CampaignsReport />
    case 'funnel':
      return <FunnelReport />
    case 'sentiment':
      return <SentimentReport />
    case 'overview':
    case 'insights':
      return null
  }
}
