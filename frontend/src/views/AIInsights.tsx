import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { ChartContainer } from '../components/ui/ChartContainer'
import { Modal } from '../components/ui/Modal'
import { objectionShare } from '../mock/data'
import {
  actionableInsights,
  agentFilterOptions,
  agentSpotlight,
  callReportCampaignsFilter,
  conversionTrend7d,
  drillDownByObjection,
  objectionConversionCorrelation,
  objectionTrend7d,
  riskPatterns,
  sentimentTrend7d,
  timeRangeOptions,
  weeklySummaryByCampaign,
  weeklySummaryDefault,
  winningPatterns,
  type InsightTrend,
  type ObjectionConversionRow,
} from '../mock/aiInsightsData'

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#94a3b8']

function TrendBadge({ trend }: { trend: InsightTrend }) {
  if (trend === 'up') return <span className="text-emerald-600">Trend ↑</span>
  if (trend === 'down') return <span className="text-red-600">Trend ↓</span>
  return <span className="text-muted">Trend →</span>
}

function portfolioAvgConversion(): number {
  const sum = objectionConversionCorrelation.reduce(
    (s, r) => s + r.conversionWhenPresentPct * (r.sharePct / 100),
    0,
  )
  return Math.round(sum * 10) / 10
}

export function AIInsights() {
  const navigate = useNavigate()
  const onOpenScripts = () => navigate('/scripts')
  const [campaignId, setCampaignId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [rangeDays, setRangeDays] = useState('7')
  const [drillRow, setDrillRow] = useState<ObjectionConversionRow | null>(null)

  const weeklyBlurb = useMemo(() => {
    if (campaignId && weeklySummaryByCampaign[campaignId]) {
      return weeklySummaryByCampaign[campaignId]
    }
    return weeklySummaryDefault
  }, [campaignId])

  const priceRow = objectionConversionCorrelation.find((r) => r.objection === 'Price')
  const avgConv = portfolioAvgConversion()

  const priceTrendArrow =
    objectionTrend7d[objectionTrend7d.length - 1]!.price >
    objectionTrend7d[0]!.price
      ? 'up'
      : objectionTrend7d[objectionTrend7d.length - 1]!.price <
          objectionTrend7d[0]!.price
        ? 'down'
        : 'flat'

  const filterHint =
    campaignId || agentId
      ? 'Segment filters adjust the executive summary copy (demo). Wire real segmentation when analytics API is available.'
      : null

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
              📌 Weekly summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text">{weeklyBlurb}</p>
            {filterHint && (
              <p className="mt-2 text-xs text-muted">{filterHint}</p>
            )}
          </div>
          {rangeDays === '30' && (
            <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-muted ring-1 ring-border">
              30-day lens (trends scaled)
            </span>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-slate-50/80 p-4">
        <label className="text-sm">
          <span className="text-muted">Campaign</span>
          <select
            className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
          >
            {callReportCampaignsFilter.map((c) => (
              <option key={c.id || 'all'} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted">Agent</span>
          <select
            className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            {agentFilterOptions.map((a) => (
              <option key={a.id || 'all'} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted">Time range</span>
          <select
            className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm"
            value={rangeDays}
            onChange={(e) => setRangeDays(e.target.value)}
          >
            {timeRangeOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Card className="border-violet-200 bg-violet-50/90">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-violet-950">🧠 AI recommendations</h2>
          <button
            type="button"
            onClick={() => onOpenScripts?.()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
          >
            Optimize script →
          </button>
        </div>
        <ul className="space-y-3">
          {actionableInsights.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-violet-200 bg-white/90 px-3 py-2 text-sm text-violet-950 shadow-sm"
            >
              <p className="font-medium">{a.headline}</p>
              <p className="mt-1 text-muted">{a.detail}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-muted">Top objection</p>
          <p className="mt-2 text-2xl font-semibold text-text">Price</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <TrendBadge trend={priceTrendArrow as InsightTrend} />
            <span className="text-muted">Share {priceRow?.sharePct ?? 38}% of mentions</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Impact: when present, conversion ~{priceRow?.conversionWhenPresentPct ?? 12}% (
            {priceRow && priceRow.conversionVsAvgPts > 0 ? '+' : ''}
            {priceRow?.conversionVsAvgPts ?? -16} pts vs {avgConv}% avg)
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Best tone</p>
          <p className="mt-2 text-2xl font-semibold text-text">Friendly</p>
          <p className="mt-2 text-xs text-emerald-700">+~22% lift in positive sentiment vs terse opens</p>
          <p className="mt-1 text-xs text-muted">Highest correlation with booked / qualified outcomes</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Top agent</p>
          <p className="mt-2 text-2xl font-semibold text-text">{agentSpotlight.name}</p>
          <p className="mt-2 text-xs font-medium text-text">
            {agentSpotlight.conversionPct}% conversion · {agentSpotlight.callsHandled.toLocaleString()} calls
            handled
          </p>
          <p className="mt-1 text-xs text-muted">Blended QA + outcomes (mock)</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="✅ Winning patterns" description="Behaviors that correlate with stronger outcomes.">
          <ul className="space-y-2">
            {winningPatterns.map((w) => (
              <li
                key={w.id}
                className="flex justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm"
              >
                <span className="font-medium text-emerald-950">{w.label}</span>
                <span className="shrink-0 font-semibold text-emerald-800">{w.impact}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="❌ Risk patterns" description="What to avoid — fastest path to coaching fixes.">
          <ul className="space-y-2">
            {riskPatterns.map((r) => (
              <li
                key={r.id}
                className="flex justify-between gap-3 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-sm"
              >
                <span className="font-medium text-red-950">{r.label}</span>
                <span className="shrink-0 font-semibold text-red-800">{r.impact}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        title="Objection → conversion correlation"
        description="Click a row to drill into transcripts and script fixes. Higher share + low conversion = priority."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted">
                <th className="py-2 pr-3">Objection</th>
                <th className="py-2 pr-3">Share</th>
                <th className="py-2 pr-3">Conv. when present</th>
                <th className="py-2 pr-3">vs avg</th>
                <th className="py-2">7d</th>
              </tr>
            </thead>
            <tbody>
              {objectionConversionCorrelation.map((row) => (
                <tr
                  key={row.objection}
                  className="cursor-pointer border-b border-border/80 hover:bg-primary/5"
                  onClick={() => setDrillRow(row)}
                >
                  <td className="py-2.5 pr-3 font-medium text-text">{row.objection}</td>
                  <td className="py-2.5 pr-3">{row.sharePct}%</td>
                  <td className="py-2.5 pr-3 font-semibold text-primary">
                    {row.conversionWhenPresentPct}%
                  </td>
                  <td className="py-2.5 pr-3 text-muted">
                    {row.conversionVsAvgPts > 0 ? '+' : ''}
                    {row.conversionVsAvgPts} pts
                  </td>
                  <td className="py-2.5">
                    <TrendBadge trend={row.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted">
            Price objections are most damaging to conversion in this portfolio snapshot.
          </p>
          <button
            type="button"
            onClick={() => onOpenScripts?.()}
            className="rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
          >
            Open Script Management
          </button>
        </div>
      </Card>

      <Card
        title="🧑‍💼 What makes this agent effective"
        description={`Spotlight: ${agentSpotlight.name}`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Performance</p>
            <p className="mt-1 text-lg font-semibold text-text">
              {agentSpotlight.conversionPct}% conversion ·{' '}
              {agentSpotlight.callsHandled.toLocaleString()} calls
            </p>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text">
            {agentSpotlight.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartContainer
          title="Objection trend"
          description="Share of evaluated calls (mock). Price ↑ this week."
          height={200}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={objectionTrend7d} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="price" name="Price %" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="trust" name="Trust %" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Sentiment trend" description="% positive (mock)" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sentimentTrend7d} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Line
                type="monotone"
                dataKey="positive"
                name="Positive %"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Conversion trend" description="Portfolio rate (mock)" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={conversionTrend7d} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="rate" name="Conv %" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <Card
        className="border-amber-200 bg-amber-50/50"
        title="🔗 Script integration"
        description="Close the loop from insight to script iteration."
      >
        <p className="text-sm text-text">
          Price objection share is elevated — align renewal and win-back scripts with value-before-price framing.
        </p>
        <button
          type="button"
          onClick={() => onOpenScripts?.()}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Optimize scripts in Script Management
        </button>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Objections breakdown" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={objectionShare} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Share of objections" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={objectionShare}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
              >
                {objectionShare.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <Modal
        open={!!drillRow}
        onClose={() => setDrillRow(null)}
        title={drillRow ? `Drill-down — ${drillRow.objection} objection` : 'Drill-down'}
        size="lg"
      >
        {drillRow &&
          (() => {
            const detail = drillDownByObjection[drillRow.objection]
            if (!detail) return <p className="text-sm text-muted">No drill-down for this row.</p>
            return (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-text">When it shows up</p>
                  <p className="mt-1 text-muted">{detail.timingNote}</p>
                </div>
                <div>
                  <p className="font-semibold text-text">Sample lines from transcripts</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                    {detail.sampleSnippets.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-3">
                  <p className="font-semibold text-text">Suggested script improvement</p>
                  <p className="mt-1 text-muted">{detail.suggestedFix}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDrillRow(null)
                    onOpenScripts?.()
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  Apply in Script Management →
                </button>
              </div>
            )
          })()}
      </Modal>
    </div>
  )
}
