import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { ChartContainer } from '../components/ui/ChartContainer'
import { callsTrend, dashboardMetrics } from '../mock/data'

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

export function Dashboard() {
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
    </div>
  )
}
