import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { pickSuggestions, suggestNextLine } from '../mock/ai'
import { agentCustomer } from '../mock/data'
import type { CallOutcome } from '../types/app'

const OUTCOMES: CallOutcome[] = [
  'Booked',
  'Follow-up',
  'No answer',
  'Declined',
  'Qualified',
]

export function AgentApp() {
  const [callActive, setCallActive] = useState(false)
  const [showWrap, setShowWrap] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(() => pickSuggestions(4))
  const [outcome, setOutcome] = useState<CallOutcome>('Follow-up')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!callActive) return
    const id = window.setInterval(() => {
      setSuggestions((prev) => {
        const next = suggestNextLine()
        const merged = [...prev.slice(1), next]
        return merged
      })
    }, 4000)
    return () => window.clearInterval(id)
  }, [callActive])

  function startCall() {
    setShowWrap(false)
    setCallActive(true)
    setSuggestions(pickSuggestions(4))
    toast.message('Call started (simulated)')
  }

  function endCall() {
    setCallActive(false)
    setShowWrap(true)
    toast.message('Call ended')
  }

  function saveWrap() {
    toast.success('Outcome and notes saved (demo)')
    setShowWrap(false)
    setNotes('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Card title={`Customer — ${agentCustomer.name}`}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startCall}
              disabled={callActive}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Call
            </button>
            <button
              type="button"
              onClick={endCall}
              disabled={!callActive}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              End Call
            </button>
            {callActive && (
              <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            )}
          </div>
        </Card>

        <Card title="Script">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {agentCustomer.script}
          </p>
        </Card>

        {showWrap && (
          <Card title="Wrap up">
            <div className="space-y-3">
              <div>
                <label htmlFor="outcome" className="mb-1 block text-sm font-medium">
                  Outcome
                </label>
                <select
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                >
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="mb-1 block text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Key points, follow-ups…"
                  className="w-full resize-y rounded-xl border border-border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </div>
              <button
                type="button"
                onClick={saveWrap}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Save
              </button>
            </div>
          </Card>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card
          title="Live AI Assist"
          description="Suggestions refresh every few seconds while a call is active."
          className="border-primary/20 bg-gradient-to-b from-white to-primary/5"
        >
          <ul className="space-y-3">
            {suggestions.map((line, i) => (
              <li
                key={`${line}-${i}`}
                className="rounded-lg border border-border/80 bg-white/80 px-3 py-2 text-sm text-text shadow-sm transition-all duration-300"
              >
                {line}
              </li>
            ))}
          </ul>
          {!callActive && (
            <p className="mt-3 text-xs text-muted">
              Start a call to rotate coaching hints.
            </p>
          )}
        </Card>
      </aside>
    </div>
  )
}
