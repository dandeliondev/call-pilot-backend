import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { LegacyCard as Card } from '../components/ui/LegacyCard'
import { ChartContainer } from '../components/ui/ChartContainer'
import { PeakCallingHeatmap } from '../components/dashboard/PeakCallingHeatmap'
import {
  aiRecommendations,
  callOutcomeBreakdown,
  callsTrend,
  conversionFunnel,
  dashboardMetrics,
  peakCallingHeatmap,
  scriptEffectiveness,
} from '../mock/data'
import type { AiRecommendationItem } from '../mock/data'

const CHART_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#94a3b8']

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: string | number
  suffix?: string
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-text">
        {value}
        {suffix && (
          <span className="text-lg font-normal text-muted">{suffix}</span>
        )}
      </p>
    </Card>
  )
}

function recommendationBadge(tag: AiRecommendationItem['tag']) {
  const styles: Record<AiRecommendationItem['tag'], string> = {
    timing: 'bg-blue-50 text-blue-800 ring-blue-100',
    script: 'bg-violet-50 text-violet-800 ring-violet-100',
    risk: 'bg-amber-50 text-amber-900 ring-amber-100',
    ops: 'bg-slate-100 text-slate-700 ring-slate-200',
  }
  const labels: Record<AiRecommendationItem['tag'], string> = {
    timing: 'Timing',
    script: 'Script',
    risk: 'Risk',
    ops: 'Ops',
  }
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${styles[tag]}`}
    >
      {labels[tag]}
    </span>
  )
}

const outcomeTotal = callOutcomeBreakdown.reduce((s, x) => s + x.value, 0)

function HorizontalConversionFunnel() {
  const top = conversionFunnel[0]?.value ?? 1
  return (
    <div className="flex h-full flex-col justify-center gap-3.5 py-1">
      {conversionFunnel.map((row) => {
        const pctOfTop = (row.value / top) * 100
        const barWidth = Math.max(pctOfTop, 2)
        return (
          <div
            key={row.name}
            className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(7rem,11rem)_1fr_minmax(9rem,11rem)] sm:gap-4"
          >
            <span className="text-sm font-medium text-text">{row.name}</span>
            <div className="min-h-9 w-full overflow-hidden rounded-lg bg-slate-100">
              <div
                className="h-9 max-w-full rounded-lg bg-gradient-to-r from-primary to-primary/75 shadow-sm transition-[width] duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm tabular-nums text-text sm:text-right">
              <span className="font-semibold">{row.value.toLocaleString()}</span>{' '}
              <span className="font-normal text-muted">
                ({pctOfTop.toFixed(pctOfTop >= 10 ? 0 : 1)}%)
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const onOpenLive = () => navigate('/live')
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Calls"
          value={dashboardMetrics.totalCalls.toLocaleString()}
        />
        <MetricCard label="Active Campaigns" value={dashboardMetrics.activeCampaigns} />
        <MetricCard
          label="Avg AI Score"
          value={dashboardMetrics.avgAiScore}
          suffix="/100"
        />
        <MetricCard
          label="Conversion Rate"
          value={dashboardMetrics.conversionRate}
          suffix="%"
        />
      </div>

      <Card className="border-emerald-200/90 bg-gradient-to-r from-emerald-50/95 via-white to-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <span className="text-muted">Active calls</span>
              <span className="text-xl font-semibold tabular-nums text-text">23</span>
            </div>
            <div>
              <span className="text-muted">🧑‍💼 Active agents</span>{' '}
              <span className="text-xl font-semibold tabular-nums text-text">12</span>
            </div>
            <div>
              <span className="text-muted">📞 Calls in queue</span>{' '}
              <span className="text-xl font-semibold tabular-nums text-text">5</span>
            </div>
          </div>
          {onOpenLive && (
            <button
              type="button"
              onClick={onOpenLive}
              className="shrink-0 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50"
            >
              Open Live Monitor →
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Snapshot only — full live floor, feeds, and AI alerts are on Live Monitor.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartContainer
          title="Conversion funnel"
          description="Horizontal view — stage volume vs dialed (top of funnel)."
          height={340}
        >
          <HorizontalConversionFunnel />
        </ChartContainer>

        <ChartContainer
          title="Call outcome breakdown"
          description="Answered vs unanswered, drops, and voicemail — raw totals, not just headline volume."
          height={340}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[...callOutcomeBreakdown]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${(((percent ?? 0) as number) * 100).toFixed(0)}%`
                }
              >
                {[...callOutcomeBreakdown].map((_, i) => (
                  <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const v = Number(value ?? 0)
                  const pct = outcomeTotal ? ((v / outcomeTotal) * 100).toFixed(1) : '0'
                  const nm =
                    item &&
                    typeof item === 'object' &&
                    'payload' in item &&
                    item.payload &&
                    typeof item.payload === 'object' &&
                    'name' in item.payload
                      ? String((item.payload as { name?: string }).name)
                      : '—'
                  return [`${v.toLocaleString()} (${pct}%)`, nm]
                }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'var(--shadow-card)',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartContainer
          title="AI script effectiveness"
          description="Conversion rate vs avg AI score by script (tooltip includes avg duration)."
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...scriptEffectiveness]}
              margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="script"
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={70}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[0, 100]}
                label={{
                  value: '% / score',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#94a3b8',
                  fontSize: 11,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as (typeof scriptEffectiveness)[number]
                  return (
                    <div
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-[var(--shadow-card)]"
                      style={{ outline: 'none' }}
                    >
                      <p className="font-medium text-text">{row.script}</p>
                      <p className="mt-1 text-muted">
                        Avg call duration:{' '}
                        <span className="text-text">{row.avgDurationMin.toFixed(1)} min</span>
                      </p>
                      <ul className="mt-2 space-y-0.5 text-muted">
                        {payload.map((p) => (
                          <li key={String(p.dataKey)} className="flex justify-between gap-6">
                            <span>{p.name}</span>
                            <span className="font-medium text-text">
                              {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                              {p.dataKey === 'conversionPct' ? '%' : '/100'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                }}
              />
              <Legend />
              <Bar
                dataKey="conversionPct"
                name="Conversion %"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="avgScore"
                name="Avg AI score"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Peak calling hours"
          description="Relative connect quality by weekday and hour (mock intensity)."
          height={320}
        >
          <PeakCallingHeatmap
            hourLabels={peakCallingHeatmap.hourLabels}
            dayLabels={peakCallingHeatmap.dayLabels}
            values={peakCallingHeatmap.values}
          />
        </ChartContainer>
      </div>

      <ChartContainer
        title="Calls (last 7 days)"
        description="Trend is illustrative mock data."
        height={320}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={callsTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: 'var(--shadow-card)',
              }}
            />
            <Line
              type="monotone"
              dataKey="calls"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <Card>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-text">AI recommendations</h3>
          <p className="mt-1 text-sm text-muted">
            Priority signals from your mock analytics layer — swap for live model output when wired.
          </p>
        </div>
        <ul className="space-y-4">
          {aiRecommendations.map((rec) => (
            <li
              key={rec.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-slate-50/80 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {recommendationBadge(rec.tag)}
                  <p className="font-medium text-text">{rec.headline}</p>
                </div>
                <p className="text-sm text-muted">{rec.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
