import { useCallback, useEffect, useMemo, useState } from 'react'
import { LegacyCard as Card } from '../components/ui/LegacyCard'
import type { Sentiment } from '../types/app'

type LiveCallPhase = 'Ringing' | 'Connected' | 'Talking'

interface LiveCallRow {
  id: string
  agent: string
  campaign: string
  startedAt: number
  sentiment: Sentiment
  phase: LiveCallPhase
}

interface AgentRow {
  name: string
  state: 'available' | 'on_call' | 'offline'
}

interface FeedItem {
  id: string
  at: number
  text: string
  tone: 'info' | 'success' | 'warn'
}

const SEED_CALLS: Omit<LiveCallRow, 'startedAt'>[] = [
  { id: 'L1', agent: 'Sarah Chen', campaign: 'Outbound renewal', phase: 'Talking', sentiment: 'Positive' },
  { id: 'L2', agent: 'Marcus Lee', campaign: 'Inbound demo', phase: 'Connected', sentiment: 'Neutral' },
  { id: 'L3', agent: 'Priya Sharma', campaign: 'Win-back', phase: 'Ringing', sentiment: 'Neutral' },
  { id: 'L4', agent: 'John Doe', campaign: 'Outbound renewal', phase: 'Talking', sentiment: 'Positive' },
  { id: 'L5', agent: 'Elena Rossi', campaign: 'Inbound demo', phase: 'Talking', sentiment: 'Negative' },
]

const AGENT_NAMES = ['Sarah Chen', 'Marcus Lee', 'Priya Sharma', 'John Doe', 'Elena Rossi', 'Alex Kim', 'Jordan Blake', 'Taylor Reed', 'Casey Ng', 'Riley Fox', 'Morgan Wu', 'Jamie Ortiz']

function formatDuration(startedAt: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function sentimentColor(s: Sentiment): string {
  if (s === 'Positive') return 'text-emerald-600'
  if (s === 'Negative') return 'text-red-600'
  return 'text-amber-700'
}

function phaseBadge(p: LiveCallPhase): string {
  if (p === 'Ringing') return 'bg-amber-100 text-amber-900 ring-amber-200'
  if (p === 'Connected') return 'bg-sky-100 text-sky-900 ring-sky-200'
  return 'bg-emerald-100 text-emerald-900 ring-emerald-200'
}

export function LiveMonitor() {
  const [tick, setTick] = useState(0)
  const [calls, setCalls] = useState<LiveCallRow[]>(() =>
    SEED_CALLS.map((c, i) => ({
      ...c,
      startedAt: Date.now() - (120 + i * 37) * 1000,
    })),
  )
  const [feed, setFeed] = useState<FeedItem[]>(() => [
    {
      id: 'f0',
      at: Date.now() - 120000,
      text: 'Floor supervisor assigned overflow queue to Team B.',
      tone: 'info',
    },
    {
      id: 'f1',
      at: Date.now() - 90000,
      text: 'John Doe — call ended · Outcome: Booked',
      tone: 'success',
    },
    {
      id: 'f2',
      at: Date.now() - 45000,
      text: 'Negative sentiment spike on Win-back queue (3 calls / 10 min).',
      tone: 'warn',
    },
  ])
  const [listenId, setListenId] = useState<string | null>('L1')
  const [aiLiveScore, setAiLiveScore] = useState(84)
  const [transcriptIdx, setTranscriptIdx] = useState(0)

  const transcriptLines = useMemo(
    () => [
      'Agent: Thanks for taking my call — is now still okay for a quick renewal check-in?',
      'Customer: Sure, I only have a few minutes.',
      'Agent: Perfect. I see your renewal window opens next week—want me to walk through bundle options?',
      'Customer: Yes, but last year the premium jumped quite a bit.',
      'Agent: Totally fair—let me anchor total cost of ownership before we touch the dollar amount…',
    ],
    [],
  )

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setAiLiveScore((s) => Math.min(96, Math.max(72, s + (Math.random() > 0.5 ? 1 : -1))))
      setTranscriptIdx((i) => (i + 1 >= transcriptLines.length ? i : i + 1))
    }, 2800)
    return () => window.clearInterval(id)
  }, [transcriptLines.length])

  useEffect(() => {
    const id = window.setInterval(() => {
      setCalls((prev) =>
        prev.map((c) => {
          if (Math.random() > 0.92 && c.phase === 'Ringing') {
            return { ...c, phase: 'Connected' as const }
          }
          if (Math.random() > 0.94 && c.phase === 'Connected') {
            return { ...c, phase: 'Talking' as const }
          }
          if (Math.random() > 0.96) {
            const sentiments: Sentiment[] = ['Positive', 'Neutral', 'Negative']
            return { ...c, sentiment: sentiments[Math.floor(Math.random() * 3)]! }
          }
          return c
        }),
      )
    }, 4000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      const agent = AGENT_NAMES[n % AGENT_NAMES.length]!
      let text: string
      let tone: FeedItem['tone'] = 'info'
      const r = n % 5
      if (r === 0) text = `${agent} started a call`
      else if (r === 1) {
        text = 'Queue depth dipped below SLA threshold ✓'
        tone = 'success'
      } else if (r === 2) {
        text = 'AI: price objection density elevated on renewal queue'
        tone = 'warn'
      } else if (r === 3) {
        text = `Call ended — ${agent} · Outcome: Booked`
        tone = 'success'
      } else {
        text = `Negative sentiment flagged on ${agent}'s line (review suggested)`
        tone = 'warn'
      }
      setFeed((f) =>
        [{ id: `f-${Date.now()}`, at: Date.now(), text, tone }, ...f].slice(0, 24),
      )
    }, 11000)
    return () => window.clearInterval(id)
  }, [])

  const agents = useMemo((): AgentRow[] => {
    const onCall = new Set(calls.map((c) => c.agent))
    return AGENT_NAMES.map((name, i) => {
      if (onCall.has(name)) return { name, state: 'on_call' as const }
      const offline = (i * 3 + tick) % 11 === 0
      return { name, state: offline ? ('offline' as const) : ('available' as const) }
    })
  }, [calls, tick])

  const metrics = useMemo(() => {
    const inProgress = calls.filter((c) => c.phase !== 'Ringing').length
    const completedToday = 412 + (tick % 7)
    const conv = 24.2 + (tick % 5) * 0.1
    const avgDurMin = 6.4 + (tick % 3) * 0.05
    return { inProgress, completedToday, conv, avgDurMin }
  }, [calls, tick])

  const selected =
    (listenId ? calls.find((c) => c.id === listenId) : null) ?? calls[0] ?? null

  const listeningLines = transcriptLines.slice(0, transcriptIdx + 1)

  const toggleListen = useCallback(() => {
    setListenId((id) => (id ? null : selected?.id ?? null))
  }, [selected])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Simulated real-time floor — timers, sentiment, and AI signals update for demos (no telephony connection).
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricPill label="Calls in progress" value={String(calls.length)} accent="from-emerald-500/15 to-white" />
        <MetricPill
          label="Completed today"
          value={metrics.completedToday.toLocaleString()}
          accent="from-sky-500/15 to-white"
        />
        <MetricPill
          label="Live conversion (rolling)"
          value={`${metrics.conv.toFixed(1)}%`}
          accent="from-violet-500/15 to-white"
        />
        <MetricPill
          label="Avg duration (today)"
          value={`${metrics.avgDurMin.toFixed(1)} min`}
          accent="from-amber-500/15 to-white"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Active calls" description="Live duration updates every second.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2 pr-3 font-medium">Agent</th>
                  <th className="pb-2 pr-3 font-medium">Campaign</th>
                  <th className="pb-2 pr-3 font-medium">Duration</th>
                  <th className="pb-2 pr-3 font-medium">Sentiment</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-border/70 ${listenId === c.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 pr-3 font-medium text-text">{c.agent}</td>
                    <td className="py-2 pr-3 text-muted">{c.campaign}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums text-primary">
                      {formatDuration(c.startedAt)}
                    </td>
                    <td className={`py-2 pr-3 font-medium ${sentimentColor(c.sentiment)}`}>{c.sentiment}</td>
                    <td className="py-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${phaseBadge(c.phase)}`}>
                        {c.phase}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Agent status" description="Supervisor floor view">
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {agents.map((a) => (
              <li
                key={a.name}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="font-medium">{a.name}</span>
                <span className="text-xs font-medium">
                  {a.state === 'available' && <span className="text-emerald-600">🟢 Available</span>}
                  {a.state === 'on_call' && <span className="text-red-600">🔴 On call</span>}
                  {a.state === 'offline' && <span className="text-slate-500">⚪ Offline</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Live activity feed">
          <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
            {feed.map((item) => (
              <li
                key={item.id}
                className={`rounded-lg border px-3 py-2 ${
                  item.tone === 'warn'
                    ? 'border-amber-200 bg-amber-50/80 text-amber-950'
                    : item.tone === 'success'
                      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
                      : 'border-border bg-slate-50/80 text-text'
                }`}
              >
                <span className="text-xs text-muted">
                  {new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <p className="mt-0.5">{item.text}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Alerts — real-time AI">
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-950">
              High drop rate on calls under 90s — coach micro-hooks after greeting.
            </li>
            <li className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
              Agent struggling with objections: Elena Rossi — suggest objection drill sheet.
            </li>
            <li className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-violet-950">
              Spike in price objections on renewal queue — deploy ROI one-pager prompt.
            </li>
          </ul>
        </Card>
      </div>

      <Card
        title="Call monitoring (simulated)"
        description="Listen + transcript + rolling AI score — demo only, no audio stream."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-muted">
              Selected: <strong className="text-text">{selected?.agent ?? '—'}</strong> · {selected?.campaign}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleListen}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                  listenId ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-95'
                }`}
              >
                {listenId ? '● Stop' : '▶ Listen (simulated)'}
              </button>
              <span className="self-center text-xs text-muted">Waveform + codec mocked in-browser.</span>
            </div>
            <div className="mt-4 h-12 rounded-lg bg-slate-100">
              <div
                className="flex h-full items-end gap-0.5 px-2 pb-2 pt-3"
                aria-hidden
              >
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 flex-1 rounded-sm bg-primary/50"
                    style={{
                      height: `${12 + ((i * 7 + tick * 3) % 28)}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Live transcript</p>
              <p className="text-sm font-semibold text-primary">AI score: {aiLiveScore}</p>
            </div>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-slate-50 p-4 text-sm leading-relaxed text-text">
              {listeningLines.join('\n\n')}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MetricPill({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-gradient-to-br px-4 py-4 shadow-sm ${accent}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-text">{value}</p>
    </div>
  )
}
