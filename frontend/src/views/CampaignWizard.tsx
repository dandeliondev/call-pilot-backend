import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import {
  generateAgentSoundboard,
  generateCampaignFromDescription,
} from '../lib/campaignAiMock'
import { createCampaign, listKnownAgents } from '../mock/campaignsStore'
import { DEMO_RANDOM_CAMPAIGN_DESCRIPTIONS } from '../mock/campaignRandomDescriptions'
import { initialScripts } from '../mock/data'
import { SoundboardBundlePreview } from '../components/campaign/SoundboardBundlePreview'
import type {
  AgentSoundboardBundle,
  CampaignLifecycleState,
  ManagedCampaign,
} from '../types/app'

const STEPS = ['Describe', 'Scripts', 'Configure', 'Resources', 'Launch'] as const

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
  'Europe/London',
] as const

interface CampaignWizardProps {
  onCancel: () => void
  onComplete: (campaignId: string) => void
}

export function CampaignWizard({ onCancel, onComplete }: CampaignWizardProps) {
  const [step, setStep] = useState(0)

  const [brief, setBrief] = useState('')
  /** Mock “AI” draft fields — shown on Describe; editable after generation. */
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
  const [callLimitDaily, setCallLimitDaily] = useState(400)
  const [pacingSecondsBetweenCalls, setPacingSecondsBetweenCalls] = useState(15)

  const [scriptSource, setScriptSource] = useState<'library' | 'soundboard'>('library')
  const [scriptId, setScriptId] = useState<string>('s1')
  const [abScriptId, setAbScriptId] = useState<string>('')
  const [soundboardBundle, setSoundboardBundle] = useState<AgentSoundboardBundle | null>(
    null,
  )

  function toggleAgent(a: string) {
    setSelectedAgents((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    )
  }

  function applyAiFieldsFromBrief(text: string) {
    const t = text.trim()
    if (!t) return
    const d = generateCampaignFromDescription(t)
    setAudience(d.audience)
    setObjective(d.objective)
    setSuggestedScript(d.suggestedScript)
    setTone(d.tone)
  }

  function runSoundboardGenerate() {
    if (!brief.trim()) {
      toast.error('Add a campaign brief on “Describe” first, or go back to that step.')
      return
    }
    const draft = generateCampaignFromDescription(brief)
    const bundle = generateAgentSoundboard({
      description: brief,
      audience: audience.trim() || draft.audience,
      objective: objective.trim() || draft.objective,
      tone: tone.trim() || draft.tone,
    })
    setSoundboardBundle(bundle)
    toast.success(
      'Script generated — intro & pitch follow your brief; other panels use placeholder lines.',
    )
  }

  function fillRandomDemoBrief() {
    const i = Math.floor(Math.random() * DEMO_RANDOM_CAMPAIGN_DESCRIPTIONS.length)
    const next = DEMO_RANDOM_CAMPAIGN_DESCRIPTIONS[i]!
    setBrief(next)
    applyAiFieldsFromBrief(next)
    toast.message('Random description and AI draft applied — review audience & messaging on Scripts.')
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
    if (scriptSource === 'soundboard' && !soundboardBundle) {
      toast.error('Generate your script on the Scripts step before launching.')
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

    const derived = generateCampaignFromDescription(brief)
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
      scriptId: scriptSource === 'library' ? scriptId : null,
      scriptName: scriptSource === 'library' ? scriptMeta?.name ?? null : null,
      callLimitDaily,
      pacingSecondsBetweenCalls,
      aiAudience: audience.trim() || derived.audience,
      aiObjective: objective.trim() || derived.objective,
      aiSuggestedScript: suggestedScript.trim() || derived.suggestedScript,
      aiTone: tone.trim() || derived.tone,
      abScriptId: scriptSource === 'library' ? abScriptId || null : null,
      templateId: null,
      agentSoundboard: scriptSource === 'soundboard' ? soundboardBundle ?? undefined : undefined,
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
          description="Plain-language brief. Use the demo button for sample copy. Audience, objective, tone, and script outline are set on the next step."
        >
          <div className="mb-4">
            <button
              type="button"
              onClick={fillRandomDemoBrief}
              className="rounded-lg border border-dashed border-border bg-slate-50 px-3 py-2 text-xs font-medium text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-text"
            >
              Generate random campaign description using AI (demo)
            </button>
          </div>
          <textarea
            className="min-h-[140px] w-full rounded-xl border border-border px-4 py-3 text-sm"
            placeholder='e.g. "Outbound campaign to offer renewal discount for expired subscriptions"'
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!brief.trim()}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next: Scripts
            </button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card
          title="Scripts"
          description="Refine audience and messaging from your brief, then choose a soundboard. Mock AI is deterministic (no API key)."
        >
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-text">Audience & messaging</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!brief.trim()) {
                      toast.error('Add a description on the previous step first.')
                      return
                    }
                    applyAiFieldsFromBrief(brief)
                    toast.success('AI fields updated from your description.')
                  }}
                  disabled={!brief.trim()}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text hover:bg-slate-50 disabled:opacity-40"
                >
                  Apply AI to fields
                </button>
              </div>
              <p className="mb-4 text-xs text-muted">
                Filled automatically if you used the random demo on Describe, or click Apply to generate from your brief.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-muted">Target audience</span>
                  <textarea
                    className="mt-1 min-h-[88px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="AI-generated from your brief, or edit"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">Call objective</span>
                  <textarea
                    className="mt-1 min-h-[88px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="AI-generated from your brief, or edit"
                  />
                </label>
                <label className="block text-sm md:col-span-2">
                  <span className="text-muted">Suggested script outline</span>
                  <textarea
                    className="mt-1 min-h-[100px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                    value={suggestedScript}
                    onChange={(e) => setSuggestedScript(e.target.value)}
                    placeholder="AI-generated from your brief, or edit"
                  />
                </label>
                <label className="block text-sm md:col-span-2">
                  <span className="text-muted">Tone</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="AI-generated from your brief, or edit"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-text">Script setup</p>
              <p className="mt-1 text-xs text-muted">
                <strong className="font-medium text-text">Use existing script</strong> pulls a saved
                soundboard from the library. <strong className="font-medium text-text">Generate with AI</strong>{' '}
                fills Introduction and Pitch from your campaign brief (demo logic); Rebuttals, FAQs,
                and the rest use fixed placeholder lines until wired to a model.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setScriptSource('library')}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    scriptSource === 'library'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white hover:bg-slate-50'
                  }`}
                >
                  Use existing script
                </button>
                <button
                  type="button"
                  onClick={() => setScriptSource('soundboard')}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    scriptSource === 'soundboard'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white hover:bg-slate-50'
                  }`}
                >
                  Generate with AI
                </button>
              </div>
            </div>

            {scriptSource === 'library' && (
              <div className="space-y-4">
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
              </div>
            )}

            {scriptSource === 'soundboard' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <button
                    type="button"
                    onClick={runSoundboardGenerate}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                  >
                    ✨ Generate from brief
                  </button>
                  <p className="text-xs text-muted">
                    Uses your brief plus the audience & messaging fields above when set; otherwise derives them from the brief.
                  </p>
                </div>
                {soundboardBundle ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Preview (stored with campaign)
                    </p>
                    <SoundboardBundlePreview bundle={soundboardBundle} />
                  </>
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-white px-3 py-4 text-sm text-muted">
                    Generate to fill Introduction and Pitch; other panels show predetermined placeholders.
                  </p>
                )}
              </div>
            )}
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
              onClick={() => {
                if (scriptSource === 'soundboard' && !soundboardBundle) {
                  toast.error('Generate your script before continuing.')
                  return
                }
                setStep(2)
              }}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: Configure
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
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
              Next: Resources
            </button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card
          title="Assign resources"
          description="Agents and dialing limits."
        >
          <div className="space-y-6">
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
              onClick={() => setStep(2)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: Launch
            </button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title="Launch" description="Save as draft or launch — demo persists to browser storage.">
          <ul className="mb-6 space-y-2 text-sm text-muted">
            <li>
              <strong className="text-text">{name || '(unnamed)'}</strong> — {type},{' '}
              {selectedAgents.length} agent(s).
              {scriptSource === 'library' ? (
                <>
                  {' '}
                  Script:{' '}
                  <strong className="text-text">
                    {initialScripts.find((s) => s.id === scriptId)?.name ?? scriptId}
                  </strong>
                  {abScriptId ? (
                    <span>
                      {' '}
                      · A/B:{' '}
                      <strong className="text-text">
                        {initialScripts.find((s) => s.id === abScriptId)?.name ?? abScriptId}
                      </strong>
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  {' '}
                  Script:{' '}
                  <strong className="text-text">Generated with AI</strong>
                  <span className="text-muted"> — intro & pitch from brief</span>
                </>
              )}
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
              onClick={() => setStep(3)}
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
