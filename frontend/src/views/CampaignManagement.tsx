import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { metricsForCampaign } from '../lib/campaignMetrics'
import { useCampaigns } from '../hooks/useCampaigns'
import type { CampaignLifecycleState, ManagedCampaign } from '../types/app'

const STATUS_LABEL: Record<CampaignLifecycleState, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

const STATUS_STYLE: Record<CampaignLifecycleState, string> = {
  draft: 'bg-slate-100 text-slate-800 ring-slate-200',
  scheduled: 'bg-sky-100 text-sky-900 ring-sky-200',
  active: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  paused: 'bg-amber-100 text-amber-900 ring-amber-200',
  completed: 'bg-violet-100 text-violet-900 ring-violet-200',
  archived: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

interface CampaignManagementProps {
  onCreate: () => void
  onOpenCampaign: (id: string) => void
}

export function CampaignManagement({ onCreate, onOpenCampaign }: CampaignManagementProps) {
  const campaigns = useCampaigns()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignLifecycleState | ''>('')
  const [perfFilter, setPerfFilter] = useState<'all' | 'high' | 'low' | 'risk'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const enriched = useMemo(() => {
    return campaigns.map((c) => ({
      c,
      m: metricsForCampaign(c.id),
    }))
  }, [campaigns])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter(({ c, m }) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) {
        return false
      }
      const created = new Date(c.createdAt).getTime()
      if (dateFrom && created < new Date(`${dateFrom}T00:00:00`).getTime()) return false
      if (dateTo && created > new Date(`${dateTo}T23:59:59`).getTime()) return false
      if (perfFilter === 'high') {
        if (m.callsMade === 0 || m.conversionPct < 25) return false
      }
      if (perfFilter === 'low') {
        if (m.callsMade === 0 || m.conversionPct >= 20) return false
      }
      if (perfFilter === 'risk') {
        if (m.callsMade === 0 || m.conversionPct >= 15 || m.avgAiScore >= 75) return false
      }
      return true
    })
  }, [enriched, search, statusFilter, dateFrom, dateTo, perfFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Campaign command center</h2>
          <p className="text-sm text-muted">
            Search, filter, and drill into performance — create AI-assisted campaigns in minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          + Create campaign
        </button>
      </div>

      <Card title="Filters" description="Refine the list — performance uses mock call outcomes per campaign id.">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="🔍 Search name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value || '') as CampaignLifecycleState | '')}
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABEL) as CampaignLifecycleState[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={perfFilter}
            onChange={(e) => setPerfFilter(e.target.value as typeof perfFilter)}
          >
            <option value="all">Performance: any</option>
            <option value="high">Conversion ≥ 25%</option>
            <option value="low">Conversion &lt; 20%</option>
            <option value="risk">Risk (low conv + AI)</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted">
            Created from
            <input
              type="date"
              className="rounded-lg border border-border px-2 py-1.5 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            to
            <input
              type="date"
              className="rounded-lg border border-border px-2 py-1.5 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-muted">
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Calls</th>
                <th className="px-4 py-3 font-medium">Conv.</th>
                <th className="px-4 py-3 font-medium">Agents</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ c, m }) => (
                <CampaignRow key={c.id} c={c} metrics={m} onOpen={() => onOpenCampaign(c.id)} />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No campaigns match your filters.</p>
        )}
      </Card>
    </div>
  )
}

function CampaignRow({
  c,
  metrics,
  onOpen,
}: {
  c: ManagedCampaign
  metrics: { callsMade: number; conversionPct: number; avgAiScore: number }
  onOpen: () => void
}) {
  const agents = c.assignedAgents.slice(0, 3).join(', ')
  const more = c.assignedAgents.length > 3 ? ` +${c.assignedAgents.length - 3}` : ''

  return (
    <tr className="border-b border-border/80 transition-colors hover:bg-slate-50/80">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onOpen}
          className="text-left font-semibold text-primary underline-offset-2 hover:underline"
        >
          {c.name}
        </button>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{c.description}</p>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_STYLE[c.status]}`}
        >
          {STATUS_LABEL[c.status]}
        </span>
      </td>
      <td className="px-4 py-3 tabular-nums">{metrics.callsMade.toLocaleString()}</td>
      <td className="px-4 py-3 tabular-nums">
        {metrics.callsMade ? `${metrics.conversionPct}%` : '—'}
      </td>
      <td className="max-w-[220px] px-4 py-3 text-xs text-muted">
        <span className="line-clamp-2" title={c.assignedAgents.join(', ')}>
          {agents}
          {more}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{formatDate(c.createdAt)}</td>
    </tr>
  )
}
