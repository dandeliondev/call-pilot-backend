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
} from 'recharts'
import { Card } from '../components/ui/Card'
import { ChartContainer } from '../components/ui/ChartContainer'
import { objectionShare } from '../mock/data'

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#94a3b8']

export function AIInsights() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-muted">Top objection</p>
          <p className="mt-2 text-2xl font-semibold text-text">Price</p>
          <p className="mt-1 text-xs text-muted">Mentioned in 38% of evaluated calls</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Best tone</p>
          <p className="mt-2 text-2xl font-semibold text-text">Friendly</p>
          <p className="mt-1 text-xs text-muted">Highest correlation with positive sentiment</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Top agent</p>
          <p className="mt-2 text-2xl font-semibold text-text">John Doe</p>
          <p className="mt-1 text-xs text-muted">Blended AI score & conversion (mock)</p>
        </Card>
      </div>

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
    </div>
  )
}
