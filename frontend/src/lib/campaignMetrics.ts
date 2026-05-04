import { callReports } from '../mock/data'

export type CampaignComputedMetrics = {
  callsMade: number
  conversionPct: number
  avgAiScore: number
}

export function metricsForCampaign(campaignId: string): CampaignComputedMetrics {
  const rows = callReports.filter((r) => r.campaignId === campaignId)
  const n = rows.length
  if (n === 0) {
    return { callsMade: 0, conversionPct: 0, avgAiScore: 0 }
  }
  const booked = rows.filter((r) => r.outcome === 'Booked').length
  const aiSum = rows.reduce((s, r) => s + r.aiScore, 0)
  return {
    callsMade: n,
    conversionPct: Math.round((booked / n) * 1000) / 10,
    avgAiScore: Math.round(aiSum / n),
  }
}

/** Trend points for overview sparkline — calls per calendar day from mock rows */
export function callsTrendForCampaign(campaignId: string): { label: string; calls: number }[] {
  const rows = callReports.filter((r) => r.campaignId === campaignId)
  const byDay = new Map<string, number>()
  for (const r of rows) {
    const d = r.startedAt.slice(0, 10)
    byDay.set(d, (byDay.get(d) ?? 0) + 1)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, calls]) => ({ label: day.slice(5), calls }))
}

export function agentsForCampaign(campaignId: string): string[] {
  const s = new Set<string>()
  for (const r of callReports) {
    if (r.campaignId === campaignId) s.add(r.agent)
  }
  return [...s].sort()
}
