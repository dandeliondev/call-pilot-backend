import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { SkeletonLines } from '../components/ui/Skeleton'
import { Card } from '../components/ui/Card'
import { evaluateCall, type EvaluationResult } from '../mock/ai'
import { callReportCampaigns, callReports } from '../mock/data'
import type { CallReportRow, Sentiment } from '../types/app'
import {
  ALL_OUTCOMES,
  bulkInsight,
  defaultCallReportFilters,
  durationBucket,
  exportCallsCsv,
  filterCallReports,
  filtersFromSearchParams,
  filtersToSearchParams,
  formatDurationMmSs,
  initials,
  isProblemCall,
  mergedTags,
  outcomeCounts,
  summarize,
  type CallReportFilters,
} from '../lib/callReportUtils'

const TAG_PRESETS = ['Hot lead', 'Needs callback', 'Wrong number', 'Wrong person'] as const

function loadInitialFilters(readUrl: boolean): CallReportFilters {
  if (!readUrl) return defaultCallReportFilters
  if (typeof window === 'undefined') return defaultCallReportFilters
  return filtersFromSearchParams(new URLSearchParams(window.location.search))
}

function AudioPlayerMock({ durationLabel }: { durationLabel: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 2))
    }, 120)
    return () => window.clearInterval(id)
  }, [playing])

  return (
    <div className="rounded-xl border border-border bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform hover:scale-105"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 pl-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Recording (simulated)</span>
            <span>{durationLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        No audio file in this demo — progress animates when play is pressed.
      </p>
    </div>
  )
}

export type CallReportsProps = {
  /** When set, dataset is limited to this mock agent label and URL filter sync is disabled. */
  lockAgentName?: string
  /** When set, dataset is limited to this campaign id (matches `CallReportRow.campaignId`). */
  lockCampaignId?: string
}

export function CallReports({ lockAgentName, lockCampaignId }: CallReportsProps) {
  const readUrl = !lockAgentName && !lockCampaignId
  const [filters, setFilters] = useState<CallReportFilters>(() => loadInitialFilters(readUrl))
  const [extraTagsById, setExtraTagsById] = useState<Record<string, string[]>>({})
  const [selected, setSelected] = useState<CallReportRow | null>(null)
  const [tagDraft, setTagDraft] = useState('')
  const [evalLoading, setEvalLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [filtersVisible, setFiltersVisible] = useState(true)
  const fetchSeq = useRef(0)
  const skipUrlSync = useRef(true)

  useEffect(() => {
    if (!readUrl) return
    const p = filtersToSearchParams(filters)
    const qs = p.toString()
    const path = window.location.pathname
    if (skipUrlSync.current) {
      skipUrlSync.current = false
      return
    }
    window.history.replaceState({}, '', qs ? `${path}?${qs}` : path)
  }, [filters, readUrl])

  const scopedReports = useMemo(() => {
    let rows = callReports
    if (lockAgentName) rows = rows.filter((r) => r.agent === lockAgentName)
    if (lockCampaignId) rows = rows.filter((r) => r.campaignId === lockCampaignId)
    return rows
  }, [lockAgentName, lockCampaignId])

  const agentAvgScore = useMemo(() => {
    const m = new Map<string, { sum: number; n: number }>()
    for (const r of scopedReports) {
      const cur = m.get(r.agent) ?? { sum: 0, n: 0 }
      cur.sum += r.aiScore
      cur.n += 1
      m.set(r.agent, cur)
    }
    const out = new Map<string, number>()
    m.forEach((v, k) => out.set(k, Math.round(v.sum / v.n)))
    return out
  }, [scopedReports])

  const uniqueTags = useMemo(() => {
    const s = new Set<string>(TAG_PRESETS)
    for (const r of scopedReports) {
      r.tags.forEach((t) => s.add(t))
    }
    Object.values(extraTagsById).forEach((arr) => arr.forEach((t) => s.add(t)))
    return [...s].sort()
  }, [scopedReports, extraTagsById])

  const filtered = useMemo(
    () => filterCallReports(scopedReports, filters, extraTagsById),
    [scopedReports, filters, extraTagsById],
  )

  const stats = useMemo(() => summarize(filtered), [filtered])
  const outcomes = useMemo(() => outcomeCounts(filtered), [filtered])
  const insightLine = useMemo(() => bulkInsight(filtered), [filtered])
  const maxOutcome = useMemo(
    () => Math.max(1, ...ALL_OUTCOMES.map((o) => outcomes[o])),
    [outcomes],
  )

  function openReport(row: CallReportRow) {
    const seq = ++fetchSeq.current
    setSelected(row)
    setEvaluation(null)
    setEvalLoading(true)
    evaluateCall(row.id).then((r) => {
      if (seq !== fetchSeq.current) return
      setEvaluation(r)
      setEvalLoading(false)
    })
  }

  function closeModal() {
    fetchSeq.current += 1
    setSelected(null)
    setEvaluation(null)
    setEvalLoading(false)
    setTagDraft('')
  }

  function resetFilters() {
    setFilters(defaultCallReportFilters)
    toast.message('Filters reset')
  }

  function exportCsv() {
    const csv = exportCallsCsv(filtered, extraTagsById)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-reports-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  function copyShareLink() {
    const p = filtersToSearchParams(filters)
    const qs = p.toString()
    const url = `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`
    void navigator.clipboard.writeText(url).then(() => {
      toast.success('Report link copied (includes filters)')
    })
  }

  function addTagToSelected(tag: string) {
    if (!selected || !tag.trim()) return
    const t = tag.trim()
    const existing = mergedTags(selected, extraTagsById)
    if (existing.includes(t)) {
      toast.message('Tag already on this call')
      return
    }
    setExtraTagsById((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] ?? []), t],
    }))
    toast.success(`Tagged “${t}”`)
  }

  const columns: Column<CallReportRow>[] = [
    {
      key: 'flags',
      header: '',
      render: (row) => {
        const low = row.aiScore < 70
        const neg = row.sentiment === 'Negative'
        const short = row.durationSeconds < 90
        if (!low && !neg && !short) return <span className="text-muted">—</span>
        return (
          <div className="flex gap-1 text-base" title="Risk flags">
            {low ? <span aria-label="Low AI score">🔴</span> : null}
            {neg ? <span aria-label="Negative sentiment">⚠️</span> : null}
            {short ? <span aria-label="Very short call">⏱</span> : null}
          </div>
        )
      },
    },
    {
      key: 'agent',
      header: 'Agent',
      render: (row) => {
        const avg = agentAvgScore.get(row.agent) ?? row.aiScore
        return (
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
              title={`Avg AI score (dataset): ${avg}`}
            >
              {initials(row.agent)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{row.agent}</p>
              <p className="text-xs text-muted">
                Avg{' '}
                <span className="rounded bg-slate-100 px-1 font-medium text-text">{avg}</span>
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => {
        const b = durationBucket(row.durationSeconds)
        const pct = Math.min(100, (row.durationSeconds / 920) * 100)
        const bucketCls =
          b === 'Short'
            ? 'bg-amber-100 text-amber-900'
            : b === 'Medium'
              ? 'bg-sky-100 text-sky-900'
              : 'bg-emerald-100 text-emerald-900'
        return (
          <div className="min-w-[8rem]">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-sm">{row.duration}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${bucketCls}`}>
                {b}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (row) => <span className="text-text">{row.outcome}</span>,
    },
    {
      key: 'aiScore',
      header: 'AI Score',
      render: (row) => (
        <span
          className={
            row.aiScore < 70 ? 'font-semibold text-red-600' : 'font-medium text-primary'
          }
        >
          {row.aiScore}
        </span>
      ),
    },
    {
      key: 'sentiment',
      header: 'Sentiment',
      render: (row) => (
        <span
          className={
            row.sentiment === 'Positive'
              ? 'text-emerald-600'
              : row.sentiment === 'Negative'
                ? 'text-red-600'
                : 'text-amber-700'
          }
        >
          {row.sentiment}
        </span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (row) => {
        const tags = mergedTags(row, extraTagsById)
        if (tags.length === 0) return <span className="text-muted">—</span>
        return (
          <div className="flex max-w-[12rem] flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-text"
              >
                {t}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      render: (_row) => (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-slate-50"
            onClick={() => toast.message('Re-call queued (demo)')}
          >
            Re-call
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-slate-50"
            onClick={() => toast.success('Marked follow-up (demo)')}
          >
            Follow-up
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-slate-50"
            onClick={() => toast.message('Assign dialog (demo)')}
          >
            Assign
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-slate-50"
            onClick={() => toast.success('Note saved locally (demo)')}
          >
            Note
          </button>
        </div>
      ),
    },
  ]

  const tableColumns = lockAgentName
    ? columns.filter((c) => c.key !== 'agent')
    : columns

  return (
    <div className="space-y-6">
      {(lockAgentName || lockCampaignId) && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-text">
          {lockAgentName && (
            <>
              Scoped to agent <span className="font-semibold">{lockAgentName}</span>
              {lockCampaignId ? ' · ' : ' '}
            </>
          )}
          {lockCampaignId && (
            <>
              Scoped to campaign id <span className="font-mono font-semibold">{lockCampaignId}</span>{' '}
            </>
          )}
          <span className="text-muted">(mock dataset)</span>
        </div>
      )}
      <Card
        padding={false}
        className="!border-slate-200/90 !bg-gradient-to-br !from-slate-100/95 !to-slate-50/90 !shadow-sm hover:!shadow-md"
      >
        <div className="border-b border-slate-200/80 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold tracking-tight text-text">Filters</h3>
              <p className="mt-1 text-sm text-muted">
                Slice the mock dataset — empty outcome/tag selection means no restriction.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFiltersVisible((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300/90 bg-white/90 px-3 py-2 text-sm font-medium text-text shadow-sm transition-colors hover:bg-white"
              aria-expanded={filtersVisible}
            >
              {filtersVisible ? (
                <>
                  Hide filters
                  <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  Show filters
                  <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {filtersVisible && (
          <div className="space-y-4 px-5 pb-5 pt-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm">
            <span className="text-muted">Date from</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
              value={filters.dateFrom}
              onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Date to</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
              value={filters.dateTo}
              onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            />
          </label>
          {!lockCampaignId && (
            <label className="block text-sm">
              <span className="text-muted">Campaign</span>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
                value={filters.campaignId}
                onChange={(e) => setFilters((p) => ({ ...p, campaignId: e.target.value }))}
              >
                <option value="">All campaigns</option>
                {callReportCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm">
            <span className="text-muted">Sentiment</span>
            <select
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
              value={filters.sentiment}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  sentiment: e.target.value as 'all' | Sentiment,
                }))
              }
            >
              <option value="all">All</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-sm text-muted">Outcomes (none = all)</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {ALL_OUTCOMES.map((o) => (
                <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={filters.selectedOutcomes.includes(o)}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        selectedOutcomes: prev.selectedOutcomes.includes(o)
                          ? prev.selectedOutcomes.filter((x) => x !== o)
                          : [...prev.selectedOutcomes, o],
                      }))
                    }
                  />
                  {o}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted">Tags (none = all)</p>
            <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
              {uniqueTags.map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={filters.selectedTags.includes(t)}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        selectedTags: prev.selectedTags.includes(t)
                          ? prev.selectedTags.filter((x) => x !== t)
                          : [...prev.selectedTags, t],
                      }))
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-muted">AI score min</span>
              <input
                type="number"
                min={0}
                max={100}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
                value={filters.aiMin}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, aiMin: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">AI score max</span>
              <input
                type="number"
                min={0}
                max={100}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
                value={filters.aiMax}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, aiMax: Number(e.target.value) || 100 }))
                }
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-muted">Duration min (sec)</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
                value={filters.durMinSec}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, durMinSec: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Duration max (sec)</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
                value={filters.durMaxSec}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    durMaxSec: Number(e.target.value) || 3600,
                  }))
                }
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200/90 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={filters.problemsOnly}
              onChange={(e) =>
                setFilters((p) => ({ ...p, problemsOnly: e.target.checked }))
              }
            />
            Show only problematic calls (low score, negative sentiment, or very short)
          </label>
          <button
            type="button"
            className="rounded-lg border border-slate-300/90 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
            onClick={resetFilters}
          >
            Reset filters
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300/90 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
            onClick={exportCsv}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="rounded-lg border border-primary bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary shadow-sm hover:bg-primary/20"
            onClick={copyShareLink}
          >
            Copy share link
          </button>
        </div>
          </div>
        )}
      </Card>

      <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
        <span className="font-semibold">Bulk insight — </span>
        {insightLine}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-sm font-medium text-muted">Total calls (filtered)</p>
          <p className="mt-1 text-2xl font-semibold text-text">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Avg duration</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {formatDurationMmSs(stats.avgDurationSec)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Avg AI score</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {stats.total ? stats.avgAiScore.toFixed(1) : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Conversion rate</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {stats.total ? `${stats.conversionPct.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">Booked ÷ filtered calls</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-muted">Positive sentiment</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {stats.total ? `${stats.positiveSentimentPct.toFixed(1)}%` : '—'}
          </p>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Outcome distribution" description="Counts for the filtered set.">
          <div className="flex h-40 items-end gap-2 border-b border-slate-200 pb-2">
            {ALL_OUTCOMES.map((o) => {
              const c = outcomes[o]
              const barPx = maxOutcome ? (c / maxOutcome) * 120 : 0
              return (
                <div key={o} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-text">{c}</span>
                  <div className="flex h-[120px] w-full flex-col justify-end">
                    <div
                      className="w-full min-h-[3px] rounded-t-md bg-primary/80 transition-all"
                      style={{ height: `${Math.max(barPx, c > 0 ? 6 : 0)}px` }}
                    />
                  </div>
                  <span className="line-clamp-2 text-center text-[10px] leading-tight text-muted">
                    {o}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="w-full" title="Report table" description="Click a row for full detail.">
          <p className="mb-3 text-sm text-muted">
            Example: set AI max to 70 and sentiment to Negative to mirror “bad calls this week.”
          </p>
          <DataTable<CallReportRow>
            columns={tableColumns}
            rows={filtered}
            getRowKey={(r) => r.id}
            onRowClick={openReport}
            getRowClassName={(row) =>
              isProblemCall(row) ? 'bg-red-50/50' : undefined
            }
          />
        </Card>
      </div>

      <Modal
        open={!!selected}
        onClose={closeModal}
        title={selected ? `Call — ${selected.agent}` : 'Call'}
        size="xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 text-sm text-muted">
              <span>
                <span className="font-medium text-text">Campaign:</span> {selected.campaignName}
              </span>
              <span>
                <span className="font-medium text-text">Started:</span>{' '}
                {new Date(selected.startedAt).toLocaleString()}
              </span>
              <span>
                <span className="font-medium text-text">Outcome:</span> {selected.outcome}
              </span>
            </div>

            <AudioPlayerMock durationLabel={selected.duration} />

            <Card title="Transcript" padding={false} className="p-0 shadow-none border-0">
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed">
                {selected.transcript}
              </pre>
            </Card>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-text">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {mergedTags(selected, extraTagsById).map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-text"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  className="rounded-lg border border-border px-2 py-1.5 text-sm"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                >
                  <option value="">Add preset tag…</option>
                  {TAG_PRESETS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-95"
                  onClick={() => {
                    if (tagDraft) addTagToSelected(tagDraft)
                  }}
                >
                  Add tag
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-text">AI evaluation</h3>
              {evalLoading && <SkeletonLines rows={3} />}
              {evaluation && !evalLoading && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-slate-50/80 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Score breakdown
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div>
                        <p className="text-muted">Greeting</p>
                        <p className="text-lg font-semibold text-primary">
                          {evaluation.scoreBreakdown.greeting}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Objection handling</p>
                        <p className="text-lg font-semibold text-primary">
                          {evaluation.scoreBreakdown.objectionHandling}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Closing</p>
                        <p className="text-lg font-semibold text-primary">
                          {evaluation.scoreBreakdown.closing}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-900">
                      Why this score (AI)
                    </p>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-amber-950">
                      {evaluation.whyInsights.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-border bg-white p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                      Coaching notes
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-text">
                      {evaluation.feedback.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
