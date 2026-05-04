import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { generateCampaignFromDescription } from '../lib/campaignAiMock'
import { createCampaign, listKnownAgents } from '../mock/campaignsStore'
import { initialScripts } from '../mock/data'
import type { CampaignLifecycleState, ManagedCampaign } from '../types/app'

const STEPS = ['Describe', 'Configure', 'Resources', 'Launch'] as const

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
  'Europe/London',
] as const

const TEMPLATES = [
  {
    id: 'cold',
    name: 'Cold outreach',
    blurb: 'Cold outbound to qualified SMB leads with a soft permission opener.',
  },
  {
    id: 'renewal',
    name: 'Renewal',
    blurb:
      'Outbound campaign to offer renewal discount for policies nearing expiry — emphasize bundle value.',
  },
  {
    id: 'winback',
    name: 'Win-back',
    blurb: 'Re-engage customers who recently churned or quoted a competitor.',
  },
  {
    id: 'demo',
    name: 'Demo booking',
    blurb: 'Inbound-style campaign to qualify interest and land calendar demos.',
  },
] as const

interface CampaignWizardProps {
  onCancel: () => void
  onComplete: (campaignId: string) => void
}

export function CampaignWizard({ onCancel, onComplete }: CampaignWizardProps) {
  const [step, setStep] = useState(0)

  const [brief, setBrief] = useState('')
  const [aiGenerated, setAiGenerated] = useState(false)
  const [audience, setAudience] = useState('')
  const [objective, setObjective] = useState('')
  const [suggestedScript, setSuggestedScript] = useState('')
  const [tone, setTone] = useState('')

  const [name, setName] = useState('')
  const [type, setType] = useState<ManagedCampaign['type']>('outbound')
  const [scheduleLocal, setScheduleLocal] = useState('')
  const [timezone, setTimezone] = useState<string>('America/New_York')

  const agentsPool = useMemo(() => [...listKnownAgents()], [])
  const [selectedAgents, setSelectedAgents] = useState<string[]>(() =>
    agentsPool.slice(0, 2),
  )
  const [scriptId, setScriptId] = useState<string>('s1')
  const [abScriptId, setAbScriptId] = useState<string>('')
  const [callLimitDaily, setCallLimitDaily] = useState(400)
  const [pacingSecondsBetweenCalls, setPacingSecondsBetweenCalls] = useState(15)

  function runAi() {
    if (!brief.trim()) {
      toast.error('Describe what you want to achieve first.')
      return
    }
    const d = generateCampaignFromDescription(brief)
    setAudience(d.audience)
    setObjective(d.objective)
    setSuggestedScript(d.suggestedScript)
    setTone(d.tone)
    setAiGenerated(true)
    if (!name.trim()) {
      const hint = brief.slice(0, 42).trim()
      setName(hint ? `${hint}${brief.length > 42 ? '…' : ''}` : 'New campaign')
    }
    toast.success('AI draft ready — review and tune below.')
  }

  function toggleAgent(a: string) {
    setSelectedAgents((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    )
  }

  function applyTemplate(id: (typeof TEMPLATES)[number]['id']) {
    const t = TEMPLATES.find((x) => x.id === id)
    if (!t) return
    setBrief(t.blurb)
    toast.message(`Template “${t.name}” loaded — click Generate with AI.`)
  }

  function finish(mode: 'draft' | 'launch') {
    if (!name.trim()) {
      toast.error('Campaign name is required.')
      return
    }
    if (!brief.trim()) {
      toast.error('Add a short campaign brief.')
      return
    }
    const scriptMeta = initialScripts.find((s) => s.id === scriptId)
    const id = `camp-${crypto.randomUUID().slice(0, 10)}`
    const now = new Date()
    const startIso = scheduleLocal
      ? new Date(scheduleLocal).toISOString()
      : now.toISOString()
    const startMs = new Date(startIso).getTime()

    let status: CampaignLifecycleState
    if (mode === 'draft') {
      status = 'draft'
    } else if (startMs > now.getTime() + 60000) {
      status = 'scheduled'
    } else {
      status = 'active'
    }

    const record: ManagedCampaign = {
      id,
      name: name.trim(),
      description: brief.trim(),
      status,
      type,
      createdAt: now.toISOString(),
      scheduleStart: mode === 'draft' ? (scheduleLocal ? startIso : null) : startIso,
      scheduleEnd: null,
      timezone,
      assignedAgents: selectedAgents.length ? selectedAgents : agentsPool.slice(0, 2),
      scriptId,
      scriptName: scriptMeta?.name ?? null,
      callLimitDaily,
      pacingSecondsBetweenCalls,
      aiAudience: audience || generateCampaignFromDescription(brief).audience,
      aiObjective: objective || generateCampaignFromDescription(brief).objective,
      aiSuggestedScript: suggestedScript || generateCampaignFromDescription(brief).suggestedScript,
      aiTone: tone || generateCampaignFromDescription(brief).tone,
      abScriptId: abScriptId || null,
      templateId: null,
    }

    createCampaign(record)
    toast.success(mode === 'draft' ? 'Draft saved' : 'Campaign launched (demo)')
    onComplete(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to campaigns
        </button>
        <div className="flex gap-1">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === step ? 'bg-primary text-white' : 'bg-slate-100 text-muted'
              }`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
      </div>

      {step === 0 && (
        <Card
          title="Describe your campaign"
          description="Plain language — AI proposes audience, objective, script outline, and tone (demo logic, no API key required)."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="w-full text-xs font-medium text-muted">Templates</span>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              >
                {t.name}
              </button>
            ))}
          </div>
          <textarea
            className="min-h-[140px] w-full rounded-xl border border-border px-4 py-3 text-sm"
            placeholder='e.g. "Outbound campaign to offer renewal discount for expired subscriptions"'
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runAi}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              ✨ Generate with AI
            </button>
            {!aiGenerated && (
              <p className="text-xs text-muted self-center">
                Tip: one paragraph is enough — you’ll tune details next.
              </p>
            )}
          </div>

          {aiGenerated && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted">Target audience</span>
                <textarea
                  className="mt-1 min-h-[88px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Call objective</span>
                <textarea
                  className="mt-1 min-h-[88px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="text-muted">Suggested script outline</span>
                <textarea
                  className="mt-1 min-h-[100px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={suggestedScript}
                  onChange={(e) => setSuggestedScript(e.target.value)}
                />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="text-muted">Tone</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!aiGenerated}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next: Configure
            </button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Configure" description="Name, channel type, schedule, and timezone.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm md:col-span-2">
              <span className="text-muted">Campaign name</span>
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Type</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as ManagedCampaign['type'])
                }
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">Start (local)</span>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={scheduleLocal}
                onChange={(e) => setScheduleLocal(e.target.value)}
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="text-muted">Timezone</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: Resources
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card
          title="Assign resources"
          description="Agents, primary script, optional A/B script (future traffic split), pacing."
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-text">Agents / teams</p>
              <div className="flex flex-wrap gap-2">
                {agentsPool.map((a) => (
                  <label
                    key={a}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                      selectedAgents.includes(a)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedAgents.includes(a)}
                      onChange={() => toggleAgent(a)}
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>
            <label className="block text-sm">
              <span className="text-muted">Primary script</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={scriptId}
                onChange={(e) => setScriptId(e.target.value)}
              >
                {initialScripts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (v{s.version})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">A/B script (optional)</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={abScriptId}
                onChange={(e) => setAbScriptId(e.target.value)}
              >
                <option value="">None — single script</option>
                {initialScripts
                  .filter((s) => s.id !== scriptId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <span className="mt-1 block text-xs text-muted">
                Traffic split & winner analytics — wiring ahead; stored for future use.
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted">Daily call limit</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={callLimitDaily}
                  onChange={(e) => setCallLimitDaily(Number(e.target.value) || 1)}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Pacing (seconds between calls)</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={pacingSecondsBetweenCalls}
                  onChange={(e) =>
                    setPacingSecondsBetweenCalls(Number(e.target.value) || 0)
                  }
                />
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: Launch
            </button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="Launch" description="Save as draft or launch — demo persists to browser storage.">
          <ul className="mb-6 space-y-2 text-sm text-muted">
            <li>
              <strong className="text-text">{name || '(unnamed)'}</strong> — {type},{' '}
              {selectedAgents.length} agent(s), script{' '}
              {initialScripts.find((s) => s.id === scriptId)?.name ?? scriptId}
            </li>
            <li>Daily cap {callLimitDaily}, pacing {pacingSecondsBetweenCalls}s.</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => finish('draft')}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => finish('launch')}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              Launch campaign
            </button>
          </div>
          <div className="mt-6 flex justify-start">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm font-medium text-muted hover:text-text"
            >
              ← Back
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
