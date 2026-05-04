import type { CallOutcome, CallReportRow, Sentiment } from '../types/app'

export const ALL_OUTCOMES: CallOutcome[] = [
  'Booked',
  'Follow-up',
  'Qualified',
  'Declined',
  'No answer',
]

export function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  if (p.length >= 2) return `${p[0]![0] ?? ''}${p[1]![0] ?? ''}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function durationBucket(seconds: number): 'Short' | 'Medium' | 'Long' {
  if (seconds < 120) return 'Short'
  if (seconds <= 420) return 'Medium'
  return 'Long'
}

export function isProblemCall(row: CallReportRow): boolean {
  return (
    row.aiScore < 70 ||
    row.sentiment === 'Negative' ||
    row.durationSeconds < 90
  )
}

export type CallReportFilters = {
  dateFrom: string
  dateTo: string
  campaignId: string
  selectedOutcomes: CallOutcome[]
  sentiment: 'all' | Sentiment
  aiMin: number
  aiMax: number
  durMinSec: number
  durMaxSec: number
  selectedTags: string[]
  problemsOnly: boolean
}

export const defaultCallReportFilters: CallReportFilters = {
  dateFrom: '',
  dateTo: '',
  campaignId: '',
  selectedOutcomes: [],
  sentiment: 'all',
  aiMin: 0,
  aiMax: 100,
  durMinSec: 0,
  durMaxSec: 3600,
  selectedTags: [],
  problemsOnly: false,
}

export function filtersToSearchParams(f: CallReportFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.dateFrom) p.set('cr_from', f.dateFrom)
  if (f.dateTo) p.set('cr_to', f.dateTo)
  if (f.campaignId) p.set('cr_camp', f.campaignId)
  if (f.selectedOutcomes.length > 0) p.set('cr_out', f.selectedOutcomes.join(','))
  if (f.sentiment !== 'all') p.set('cr_sent', f.sentiment)
  if (f.aiMin > 0) p.set('cr_amin', String(f.aiMin))
  if (f.aiMax < 100) p.set('cr_amax', String(f.aiMax))
  if (f.durMinSec > 0) p.set('cr_dmin', String(f.durMinSec))
  if (f.durMaxSec < 3600) p.set('cr_dmax', String(f.durMaxSec))
  if (f.selectedTags.length > 0) p.set('cr_tags', f.selectedTags.join(','))
  if (f.problemsOnly) p.set('cr_prob', '1')
  return p
}

export function filtersFromSearchParams(
  sp: URLSearchParams,
): CallReportFilters {
  const f = { ...defaultCallReportFilters }
  const from = sp.get('cr_from')
  const to = sp.get('cr_to')
  const camp = sp.get('cr_camp')
  const out = sp.get('cr_out')
  const sent = sp.get('cr_sent')
  const amin = sp.get('cr_amin')
  const amax = sp.get('cr_amax')
  const dmin = sp.get('cr_dmin')
  const dmax = sp.get('cr_dmax')
  const tags = sp.get('cr_tags')
  const prob = sp.get('cr_prob')
  if (from) f.dateFrom = from
  if (to) f.dateTo = to
  if (camp) f.campaignId = camp
  if (out) {
    const parts = out.split(',').filter(Boolean) as CallOutcome[]
    f.selectedOutcomes = parts.filter((x) => ALL_OUTCOMES.includes(x))
  }
  if (sent === 'Positive' || sent === 'Neutral' || sent === 'Negative') {
    f.sentiment = sent
  }
  if (amin && !Number.isNaN(Number(amin))) f.aiMin = Number(amin)
  if (amax && !Number.isNaN(Number(amax))) f.aiMax = Number(amax)
  if (dmin && !Number.isNaN(Number(dmin))) f.durMinSec = Number(dmin)
  if (dmax && !Number.isNaN(Number(dmax))) f.durMaxSec = Number(dmax)
  if (tags) f.selectedTags = tags.split(',').filter(Boolean)
  if (prob === '1') f.problemsOnly = true
  return f
}

export function endOfDayIso(dateStr: string): string {
  const d = new Date(`${dateStr}T23:59:59`)
  return d.toISOString()
}

export function mergedTags(
  row: CallReportRow,
  extraById: Record<string, string[]>,
): string[] {
  return [...row.tags, ...(extraById[row.id] ?? [])]
}

export function filterCallReports(
  rows: CallReportRow[],
  f: CallReportFilters,
  extraTagsById: Record<string, string[]>,
): CallReportRow[] {
  return rows.filter((row) => {
    if (f.problemsOnly && !isProblemCall(row)) return false

    const started = new Date(row.startedAt).getTime()
    if (f.dateFrom) {
      const from = new Date(`${f.dateFrom}T00:00:00`).getTime()
      if (started < from) return false
    }
    if (f.dateTo) {
      const to = new Date(endOfDayIso(f.dateTo)).getTime()
      if (started > to) return false
    }

    if (f.campaignId && row.campaignId !== f.campaignId) return false

    if (f.selectedOutcomes.length > 0 && !f.selectedOutcomes.includes(row.outcome)) {
      return false
    }

    if (f.sentiment !== 'all' && row.sentiment !== f.sentiment) return false

    if (row.aiScore < f.aiMin || row.aiScore > f.aiMax) return false

    if (
      row.durationSeconds < f.durMinSec ||
      row.durationSeconds > f.durMaxSec
    ) {
      return false
    }

    const tags = mergedTags(row, extraTagsById)
    if (f.selectedTags.length > 0) {
      const hit = f.selectedTags.some((t) => tags.includes(t))
      if (!hit) return false
    }

    return true
  })
}

export type SummaryStats = {
  total: number
  avgDurationSec: number
  avgAiScore: number
  conversionPct: number
  positiveSentimentPct: number
}

export function summarize(rows: CallReportRow[]): SummaryStats {
  const n = rows.length
  if (n === 0) {
    return {
      total: 0,
      avgDurationSec: 0,
      avgAiScore: 0,
      conversionPct: 0,
      positiveSentimentPct: 0,
    }
  }
  const dur = rows.reduce((s, r) => s + r.durationSeconds, 0)
  const score = rows.reduce((s, r) => s + r.aiScore, 0)
  const booked = rows.filter((r) => r.outcome === 'Booked').length
  const pos = rows.filter((r) => r.sentiment === 'Positive').length
  return {
    total: n,
    avgDurationSec: dur / n,
    avgAiScore: score / n,
    conversionPct: (booked / n) * 100,
    positiveSentimentPct: (pos / n) * 100,
  }
}

export function outcomeCounts(rows: CallReportRow[]): Record<CallOutcome, number> {
  const init: Record<CallOutcome, number> = {
    Booked: 0,
    'Follow-up': 0,
    Qualified: 0,
    Declined: 0,
    'No answer': 0,
  }
  for (const r of rows) {
    init[r.outcome] += 1
  }
  return init
}

export function bulkInsight(rows: CallReportRow[]): string {
  if (rows.length === 0) return 'No calls match the current filters.'
  const n = rows.length
  const declined = rows.filter((r) => r.outcome === 'Declined').length
  const neg = rows.filter((r) => r.sentiment === 'Negative').length
  const low = rows.filter((r) => r.aiScore < 70).length
  const pricingHints = rows.filter((r) =>
    /price|expensive|premium|cost/i.test(r.transcript),
  ).length

  if (pricingHints >= Math.max(2, Math.ceil(n * 0.2))) {
    return `Across ${n} calls in this view, pricing came up repeatedly — tighten value framing before numbers and arm reps with a simple ROI snapshot.`
  }
  if (declined / n >= 0.3) {
    return `About ${Math.round((declined / n) * 100)}% of filtered calls declined — sample a few decline transcripts for objection themes before changing scripts.`
  }
  if (neg / n >= 0.35) {
    return `${Math.round((neg / n) * 100)}% negative sentiment here — check pacing and empathy cues after the opening minute.`
  }
  if (low / n >= 0.25) {
    return `Many scores under 70 in this slice — prioritize QA listens on those calls for coaching wins.`
  }
  return `Across ${n} calls in this filter, mix looks workable — compare campaigns when you tighten targeting next week.`
}

export function formatDurationMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function exportCallsCsv(
  rows: CallReportRow[],
  extraTagsById: Record<string, string[]>,
): string {
  const headers = [
    'id',
    'startedAt',
    'agent',
    'campaign',
    'durationSec',
    'outcome',
    'sentiment',
    'aiScore',
    'tags',
    'transcript',
  ]
  const lines = rows.map((r) => {
    const tags = mergedTags(r, extraTagsById).join('; ')
    const cells = [
      r.id,
      r.startedAt,
      r.agent,
      r.campaignName,
      String(r.durationSeconds),
      r.outcome,
      r.sentiment,
      String(r.aiScore),
      tags,
      `"${r.transcript.replace(/"/g, '""')}"`,
    ]
    return cells.join(',')
  })
  return [headers.join(','), ...lines].join('\r\n')
}
