import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import type {
  ScriptGenerateGoal,
  ScriptItem,
  ScriptOutcomeCounts,
} from '../types/app'
import { initialScripts } from '../mock/data'
import { scriptVersionDelay, upgradeScriptDraft } from '../mock/ai'

const OUTCOME_ORDER: (keyof ScriptOutcomeCounts)[] = [
  'Booked',
  'Follow-up',
  'Qualified',
  'Declined',
  'No answer',
]

const GOAL_OPTIONS: { value: ScriptGenerateGoal; label: string }[] = [
  { value: 'conversion', label: 'Optimize for higher conversion' },
  { value: 'objections', label: 'Reduce objections' },
  { value: 'shorter', label: 'Shorter calls' },
  { value: 'closing', label: 'More aggressive closing' },
]

function outcomeSum(o: ScriptOutcomeCounts): number {
  return OUTCOME_ORDER.reduce((s, k) => s + o[k], 0)
}

function deltaFmt(curr: number, prev: number, decimals = 1): string {
  const d = curr - prev
  if (Math.abs(d) < 0.05) return '—'
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(decimals)}%`
}

export function ScriptManagement() {
  const [scripts, setScripts] = useState<ScriptItem[]>(initialScripts)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [goalById, setGoalById] = useState<Record<string, ScriptGenerateGoal>>({
    s1: 'conversion',
    s2: 'conversion',
    s3: 'conversion',
  })

  const best = useMemo(
    () =>
      scripts.reduce((a, b) => (a.conversionPct >= b.conversionPct ? a : b), scripts[0]!),
    [scripts],
  )

  async function generateVersion(script: ScriptItem) {
    const goal = goalById[script.id] ?? 'conversion'
    setLoadingId(script.id)
    await scriptVersionDelay()
    setScripts((prev) =>
      prev.map((s) => (s.id === script.id ? upgradeScriptDraft(s, goal) : s)),
    )
    setLoadingId(null)
    toast.success(`New draft (v${script.version + 1}) — ${GOAL_OPTIONS.find((g) => g.value === goal)?.label ?? goal}`)
  }

  function toggleExpand(id: string) {
    setExpandedId((cur) => (cur === id ? null : id))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm shadow-sm">
        <span className="font-semibold text-amber-950">🏆 Best performing script right now: </span>
        <span className="text-amber-950">
          {best.name} · v{best.version} ·{' '}
          <span className="font-semibold">{best.conversionPct}%</span> conversion (
          {best.performancePct}% composite score)
        </span>
      </div>

      <p className="text-sm text-muted">
        Metrics are illustrative mock data — swap for production analytics when wired. Generate applies a goal-directed AI pass and appends a version snapshot for comparison.
      </p>

      <div className="grid gap-6 xl:grid-cols-2">
        {scripts.map((s) => {
          const totalOut = outcomeSum(s.outcomeBreakdown)
          const trendMax = Math.max(...s.performanceTrend.map((p) => p.value), 1)
          const open = expandedId === s.id

          return (
            <Card key={s.id} className="flex flex-col">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-text">{s.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-muted">
                      v{s.version}
                    </span>
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-muted ring-1 ring-border">
                  Composite {s.performancePct}%
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-slate-50/80 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    📈 Conversion rate
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-primary">{s.conversionPct}%</p>
                </div>
                <div className="rounded-lg border border-border bg-slate-50/80 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    ⏱ Avg call duration
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-text">{s.avgDurationMin} min</p>
                </div>
                <div className="rounded-lg border border-border bg-slate-50/80 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    😊 Sentiment score
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-emerald-700">{s.sentimentScore}/100</p>
                </div>
                <div className="rounded-lg border border-border bg-slate-50/80 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    🎯 Outcomes (sample)
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted">
                    {totalOut} evaluated calls in slice
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Outcome breakdown
                </p>
                <div className="flex flex-wrap gap-2">
                  {OUTCOME_ORDER.map((key) => {
                    const n = s.outcomeBreakdown[key]
                    const pct = totalOut ? Math.round((n / totalOut) * 100) : 0
                    return (
                      <div
                        key={key}
                        className="min-w-[5.5rem] flex-1 rounded-lg border border-border bg-white px-2 py-1.5 text-center"
                      >
                        <p className="text-[10px] font-medium text-muted">{key}</p>
                        <p className="text-sm font-semibold text-text">{n}</p>
                        <p className="text-[10px] text-muted">{pct}%</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Script funnel (mock)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ['Dialed', s.funnel.dialed],
                      ['Connected', s.funnel.connected],
                      ['Qualified', s.funnel.qualified],
                      ['Converted', s.funnel.converted],
                    ] as const
                  ).map(([label, val]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border bg-white px-2 py-2 text-center"
                    >
                      <p className="text-[10px] font-medium text-muted">{label}</p>
                      <p className="text-lg font-semibold tabular-nums text-text">
                        {val.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/90 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">
                  🧠 AI feedback
                </p>
                <p className="mt-2 text-sm leading-relaxed text-violet-950">{s.aiFeedback}</p>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Performance (7 days)
                  </p>
                  <span className="text-[10px] text-muted">Index 0–100</span>
                </div>
                <div className="flex h-14 items-end gap-1">
                  {s.performanceTrend.map((pt, i) => {
                    const barPx = Math.max(6, (pt.value / trendMax) * 52)
                    return (
                      <div
                        key={`${pt.day}-${i}`}
                        className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                        title={`${pt.day}: ${pt.value}`}
                      >
                        <div
                          className="w-full rounded-t bg-primary/85"
                          style={{ height: `${barPx}px` }}
                        />
                        <span className="hidden text-[9px] text-muted sm:inline">{pt.day.slice(-2)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Version comparison
                </p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-slate-50">
                        <th className="px-2 py-2 font-semibold">Ver</th>
                        <th className="px-2 py-2 font-semibold">Conversion</th>
                        <th className="px-2 py-2 font-semibold">Engage</th>
                        <th className="px-2 py-2 font-semibold">AI score</th>
                        <th className="px-2 py-2 font-semibold">Avg dur.</th>
                        <th className="px-2 py-2 font-semibold">Δ vs prev</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.versionHistory.map((row, i) => {
                        const prev = i > 0 ? s.versionHistory[i - 1] : null
                        const dConv = prev
                          ? deltaFmt(row.conversionPct, prev.conversionPct)
                          : '—'
                        return (
                          <tr
                            key={row.version}
                            className={
                              row.version === s.version
                                ? 'bg-primary/5 font-medium'
                                : 'border-b border-border/80'
                            }
                          >
                            <td className="px-2 py-2">v{row.version}</td>
                            <td className="px-2 py-2">{row.conversionPct}%</td>
                            <td className="px-2 py-2">{row.engagementPct}%</td>
                            <td className="px-2 py-2">{row.aiScore}</td>
                            <td className="px-2 py-2">{row.avgDurationMin}m</td>
                            <td className="px-2 py-2 text-muted">{dConv}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {s.versionHistory.length >= 2 && (
                  <p className="mt-2 text-[11px] text-muted">
                    {(() => {
                      const last = s.versionHistory[s.versionHistory.length - 1]!
                      const prev = s.versionHistory[s.versionHistory.length - 2]!
                      const bump = last.conversionPct - prev.conversionPct
                      if (bump <= 0) return `Latest vs prior: conversion ${bump.toFixed(1)}% (iterate with a new goal).`
                      return `v${last.version} performs ${bump.toFixed(1)}% better than v${prev.version} on conversion (mock delta).`
                    })()}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => toggleExpand(s.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2 text-left text-sm font-medium text-text hover:bg-slate-100"
                >
                  <span>📜 Script structure</span>
                  <span className="text-muted">{open ? '▼' : '▶'}</span>
                </button>
                {open && (
                  <div className="mt-3 space-y-3">
                    {s.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          sec.weak === 'dropoff'
                            ? 'border-red-200 bg-red-50/80'
                            : sec.weak === 'objection'
                              ? 'border-amber-200 bg-amber-50/80'
                              : 'border-border bg-white'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-text">{sec.title}</p>
                          {sec.weak === 'dropoff' && (
                            <span className="text-[10px] font-medium text-red-800">
                                  🔴 High drop-off risk
                            </span>
                          )}
                          {sec.weak === 'objection' && (
                            <span className="text-[10px] font-medium text-amber-900">
                                  ⚠️ Objection spike zone
                            </span>
                          )}
                        </div>
                        <p className="mt-1 leading-relaxed text-muted">{sec.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm italic leading-relaxed text-muted">{s.snippet}</p>

              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
                <label className="block flex-1 text-sm">
                  <span className="text-muted">Generate direction</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    value={goalById[s.id] ?? 'conversion'}
                    onChange={(e) =>
                      setGoalById((p) => ({
                        ...p,
                        [s.id]: e.target.value as ScriptGenerateGoal,
                      }))
                    }
                  >
                    {GOAL_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={loadingId === s.id}
                  onClick={() => generateVersion(s)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingId === s.id && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Generate new version
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
