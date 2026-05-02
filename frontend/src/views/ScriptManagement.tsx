import { useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import type { ScriptItem } from '../types/app'
import { initialScripts } from '../mock/data'
import { scriptVersionDelay } from '../mock/ai'

export function ScriptManagement() {
  const [scripts, setScripts] = useState<ScriptItem[]>(initialScripts)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function generateVersion(script: ScriptItem) {
    setLoadingId(script.id)
    await scriptVersionDelay()
    setScripts((prev) =>
      prev.map((s) =>
        s.id === script.id
          ? {
              ...s,
              version: s.version + 1,
              performancePct: Math.min(
                95,
                Math.max(55, s.performancePct + Math.round((Math.random() - 0.35) * 8)),
              ),
            }
          : s,
      ),
    )
    setLoadingId(null)
    toast.success(`New draft generated for "${script.name}"`)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Version badges and performance scores update locally after a simulated AI pass.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {scripts.map((s) => (
          <Card key={s.id} title={s.name}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-muted">
                v{s.version}
              </span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {s.performancePct}% performance
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text">{s.snippet}</p>
            <button
              type="button"
              disabled={loadingId === s.id}
              onClick={() => generateVersion(s)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingId === s.id && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              Generate New Version
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
