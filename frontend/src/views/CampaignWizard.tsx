import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import {
  generateAgentSoundboard,
  generateCampaignFromDescription,
  regenerateSoundboardSection,
  type CallFlowComplexity,
} from '../lib/campaignAiMock'
import { CALL_FLOW_SECTIONS, TIMEZONES, updateSoundboardLine } from '../lib/campaignCallFlowShared'
import { useCampaignsContext } from '../hooks/useCampaigns'
import { DEMO_RANDOM_CAMPAIGN_DESCRIPTIONS } from '../mock/campaignRandomDescriptions'
import { initialScripts } from '../mock/data'
import type {
  AgentSoundboardBundle,
  CampaignLifecycleState,
  ManagedCampaign,
  RegenerableSoundboardSection,
  SoundboardPanel,
} from '../types/app'

const STEPS = [
  'Describe',
  'Configure',
  'Call Flow & Responses',
  'Resources',
  'Complete',
] as const

const CALL_FLOW_STEP_LABEL = 'Call Flow & Responses'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function CampaignWizard() {
  const navigate = useNavigate()
  const onCancel = () => navigate('/campaigns')
  const onComplete = (campaignId: string) => navigate(`/campaigns/${campaignId}`)
  const { agents: agentsPool, managers: managersPool, createCampaign } = useCampaignsContext()
  const [step, setStep] = useState(0)
  const [isGeneratingRandomBrief, setIsGeneratingRandomBrief] = useState(false)

  const [brief, setBrief] = useState('')
  /** Call-flow step — drives mock soundboard generation (maps to stored campaign AI fields). */
  const [campaignGoal, setCampaignGoal] = useState('')
  const [wizardTone, setWizardTone] = useState('')
  const [complexity, setComplexity] = useState<CallFlowComplexity>('basic')
  const [aiBusy, setAiBusy] = useState<'full' | RegenerableSoundboardSection | null>(null)
  const [openFlowSections, setOpenFlowSections] = useState<Record<string, boolean>>({
    intro: true,
    pitch: true,
  })

  const [name, setName] = useState('')
  const [type, setType] = useState<ManagedCampaign['type']>('outbound')
  const [scheduleLocal, setScheduleLocal] = useState('')
  const [timezone, setTimezone] = useState<string>('America/New_York')

  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([])
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([])

  useEffect(() => {
    if (selectedAgentIds.length === 0 && agentsPool.length) {
      setSelectedAgentIds(agentsPool.slice(0, 2).map((a) => a.id))
    }
    if (selectedManagerIds.length === 0 && managersPool.length) {
      setSelectedManagerIds(managersPool.slice(0, 1).map((m) => m.id))
    }
  }, [agentsPool, managersPool, selectedAgentIds.length, selectedManagerIds.length])
  const [callLimitDaily, setCallLimitDaily] = useState(400)
  const [pacingSecondsBetweenCalls, setPacingSecondsBetweenCalls] = useState(15)

  const [scriptSource, setScriptSource] = useState<'library' | 'soundboard'>('soundboard')
  const [scriptId, setScriptId] = useState<string>('s1')
  const [abScriptId, setAbScriptId] = useState<string>('')
  const [soundboardBundle, setSoundboardBundle] = useState<AgentSoundboardBundle | null>(
    null,
  )

  function toggleAgent(id: number) {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleManager(id: number) {
    setSelectedManagerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function applyAiFieldsFromBrief(text: string) {
    const t = text.trim()
    if (!t) return
    const d = generateCampaignFromDescription(t)
    setCampaignGoal(d.objective)
    setWizardTone(d.tone)
  }

  function syncCampaignNameFromBrief(text: string) {
    const t = text.trim()
    if (!t) return
    const d = generateCampaignFromDescription(t)
    setName(d.suggestedName)
  }

  function soundboardInputFromWizard() {
    const derived = generateCampaignFromDescription(brief)
    return {
      description: brief,
      audience: derived.audience,
      objective: campaignGoal.trim() || derived.objective,
      tone: wizardTone.trim() || derived.tone,
      complexity,
    }
  }

  async function runGenerateFullCallFlow() {
    if (!brief.trim()) {
      toast.error('Add a campaign brief on “Describe” first, or go back to that step.')
      return
    }
    setAiBusy('full')
    try {
      await delay(500)
      const bundle = generateAgentSoundboard(soundboardInputFromWizard())
      setSoundboardBundle(bundle)
      setOpenFlowSections((prev) => ({
        ...prev,
        intro: true,
        pitch: true,
      }))
      toast.success('Full call flow generated — expand sections to edit lines.')
    } finally {
      setAiBusy(null)
    }
  }

  async function runRegenerateSection(section: RegenerableSoundboardSection) {
    if (!soundboardBundle) {
      toast.error('Generate the full call flow first.')
      return
    }
    setAiBusy(section)
    try {
      await delay(400)
      const next = regenerateSoundboardSection(
        soundboardBundle,
        section,
        soundboardInputFromWizard(),
      )
      setSoundboardBundle(next)
      setOpenFlowSections((prev) => ({ ...prev, [section]: true }))
      const label = CALL_FLOW_SECTIONS.find((s) => s.id === section)?.heading ?? section
      toast.message(`${label} refreshed`)
    } finally {
      setAiBusy(null)
    }
  }

  async function fillRandomDemoBrief() {
    setIsGeneratingRandomBrief(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const i = Math.floor(Math.random() * DEMO_RANDOM_CAMPAIGN_DESCRIPTIONS.length)
      const next = DEMO_RANDOM_CAMPAIGN_DESCRIPTIONS[i]!
      setBrief(next)
      applyAiFieldsFromBrief(next)
      syncCampaignNameFromBrief(next)
      toast.message(
        `Random description applied — name and goal updated from AI; configure schedule next, then build the call flow on “${CALL_FLOW_STEP_LABEL}”.`,
      )
    } finally {
      setIsGeneratingRandomBrief(false)
    }
  }

  function finish(mode: 'draft' | 'complete') {
    if (!name.trim()) {
      toast.error('Campaign name is required.')
      return
    }
    if (!brief.trim()) {
      toast.error('Add a short campaign brief.')
      return
    }
    if (scriptSource === 'soundboard' && !soundboardBundle) {
      toast.error(`Generate your call flow on “${CALL_FLOW_STEP_LABEL}” before completing.`)
      return
    }
    const scriptMeta = initialScripts.find((s) => s.id === scriptId)
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
    const selectedAgents = agentsPool.filter((a) => selectedAgentIds.includes(a.id))
    const selectedManagers = managersPool.filter((m) => selectedManagerIds.includes(m.id))
    const payload: Omit<ManagedCampaign, 'id' | 'createdAt'> = {
      name: name.trim(),
      description: brief.trim(),
      status,
      type,
      scheduleStart: mode === 'draft' ? (scheduleLocal ? startIso : null) : startIso,
      scheduleEnd: null,
      timezone,
      assignedAgents: selectedAgents,
      assignedCampaignManagers: selectedManagers,
      scriptId: scriptSource === 'library' ? scriptId : null,
      scriptName: scriptSource === 'library' ? scriptMeta?.name ?? null : null,
      callLimitDaily,
      pacingSecondsBetweenCalls,
      aiAudience: derived.audience,
      aiObjective: campaignGoal.trim() || derived.objective,
      aiSuggestedScript: derived.suggestedScript,
      aiTone: wizardTone.trim() || derived.tone,
      abScriptId: scriptSource === 'library' ? abScriptId || null : null,
      templateId: null,
      callFlowComplexity: complexity,
      agentSoundboard: scriptSource === 'soundboard' ? soundboardBundle ?? undefined : undefined,
    }

    void createCampaign(payload)
      .then((created) => {
        toast.success(mode === 'draft' ? 'Draft saved' : 'Campaign completed')
        onComplete(created.id)
      })
      .catch(() => toast.error('Could not save campaign'))
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
          description="Plain-language brief. Use the demo button for sample copy. When you continue, a campaign name is suggested from this text (mock AI); next you set type and schedule, then build the agent call flow."
        >
          <div className="mb-4">
            <button
              type="button"
              onClick={fillRandomDemoBrief}
              disabled={isGeneratingRandomBrief}
              className="rounded-lg border border-dashed border-border bg-slate-50 px-3 py-2 text-xs font-medium text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-text"
            >
              {isGeneratingRandomBrief
                ? 'AI is thinking...'
                : 'Generate random campaign description using AI (demo)'}
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
              onClick={() => {
                syncCampaignNameFromBrief(brief)
                setStep(1)
              }}
              disabled={!brief.trim()}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next: {STEPS[1]}
            </button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Configure" description="Name, channel type, schedule, and timezone.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm md:col-span-2">
              <span className="text-muted">Campaign name</span>
              <span className="mb-1 block text-xs text-muted">
                Auto-generated from your description (mock AI) when you leave Describe — you can edit anytime.
              </span>
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
              Next: {STEPS[2]}
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card
          title={CALL_FLOW_STEP_LABEL}
          description="Agent script builder — same sections as the agent soundboard. Set goal, tone, and complexity, then generate or refine per section. Mock AI only (no API key)."
        >
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-text">Script source</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setScriptSource('soundboard')}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    scriptSource === 'soundboard'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white hover:bg-slate-50'
                  }`}
                >
                  Agent script builder
                </button>
                <button
                  type="button"
                  onClick={() => setScriptSource('library')}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    scriptSource === 'library'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white hover:bg-slate-50'
                  }`}
                >
                  Use library script
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
                </label>
              </div>
            )}

            {scriptSource === 'soundboard' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void runGenerateFullCallFlow()}
                    disabled={!brief.trim() || aiBusy !== null}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                  >
                    {aiBusy === 'full' ? 'Generating…' : 'Generate full call flow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!brief.trim()) {
                        toast.error('Add a description on the previous step first.')
                        return
                      }
                      applyAiFieldsFromBrief(brief)
                      toast.success('Goal and tone updated from your brief.')
                    }}
                    disabled={!brief.trim() || aiBusy !== null}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text hover:bg-slate-50 disabled:opacity-40"
                  >
                    Sync goal & tone from brief
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm md:col-span-1">
                    <span className="font-medium text-text">Campaign goal</span>
                    <textarea
                      className="mt-1 min-h-[88px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={campaignGoal}
                      onChange={(e) => setCampaignGoal(e.target.value)}
                      placeholder="e.g. Book renewal review, recover win-back, qualify demo…"
                    />
                  </label>
                  <label className="block text-sm md:col-span-1">
                    <span className="font-medium text-text">Tone</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={wizardTone}
                      onChange={(e) => setWizardTone(e.target.value)}
                      placeholder="e.g. Friendly consultative"
                    />
                  </label>
                  <label className="block text-sm md:col-span-1">
                    <span className="font-medium text-text">Complexity</span>
                    <select
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={complexity}
                      onChange={(e) =>
                        setComplexity(e.target.value as CallFlowComplexity)
                      }
                      disabled={aiBusy !== null}
                    >
                      <option value="basic">Basic</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    <span className="mt-1 block text-xs text-muted">
                      Basic = shorter intro & pitch; advanced = full line set.
                    </span>
                  </label>
                </div>

                {!soundboardBundle ? (
                  <p className="rounded-lg border border-dashed border-border bg-white px-3 py-4 text-sm text-muted">
                    Generate the full call flow to mirror agent sections (introduction through DTMF).
                    Edit any line after generation, or regenerate one section at a time.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Sections (same layout as agent app)
                    </p>
                    {CALL_FLOW_SECTIONS.map(({ id, heading }) => {
                      const panel = soundboardBundle[id] as SoundboardPanel | undefined
                      if (!panel) return null
                      const open = openFlowSections[id] ?? false
                      const busyHere = aiBusy === id
                      return (
                        <div
                          key={id}
                          className="overflow-hidden rounded-lg border border-border bg-white"
                        >
                          <div className="flex flex-wrap items-stretch gap-2 border-b border-border/80 bg-slate-50/90 px-3 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenFlowSections((s) => ({ ...s, [id]: !open }))
                              }
                              className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold text-text"
                            >
                              <span className="text-muted tabular-nums">{open ? '▼' : '▶'}</span>
                              <span>{heading}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void runRegenerateSection(id)}
                              disabled={aiBusy !== null}
                              className="shrink-0 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-text hover:bg-slate-100 disabled:opacity-40"
                            >
                              {busyHere ? '…' : `Regenerate ${heading}`}
                            </button>
                          </div>
                          {open && (
                            <div className="space-y-3 px-3 py-3">
                              {panel.items.map((line, idx) => (
                                <label key={`${id}-${line.shortcut}-${idx}`} className="block text-xs">
                                  <span className="text-muted">
                                    Shortcut <span className="font-mono">{line.shortcut}</span>
                                    {line.tag ? (
                                      <span className="ml-1 text-violet-600">{line.tag}</span>
                                    ) : null}
                                  </span>
                                  <textarea
                                    className="mt-1 min-h-[56px] w-full rounded-lg border border-border px-3 py-2 text-sm text-text"
                                    value={line.text}
                                    onChange={(e) => {
                                      if (!soundboardBundle) return
                                      setSoundboardBundle(
                                        updateSoundboardLine(
                                          soundboardBundle,
                                          id,
                                          idx,
                                          e.target.value,
                                        ),
                                      )
                                    }}
                                    rows={2}
                                  />
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
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
              onClick={() => {
                if (scriptSource === 'soundboard' && !soundboardBundle) {
                  toast.error('Generate your call flow before continuing.')
                  return
                }
                setStep(3)
              }}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: {STEPS[3]}
            </button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card
          title="Assign resources"
          description="Campaign managers, agents, and dialing limits."
        >
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-text">Campaign managers</p>
              <p className="mb-2 text-xs text-muted">
                Oversight, approvals, and reporting contacts for this campaign (demo roster).
              </p>
              <div className="flex flex-wrap gap-2">
                {managersPool.map((m) => (
                  <label
                    key={m.id}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                      selectedManagerIds.includes(m.id)
                        ? 'border-violet-500 bg-violet-500/10 text-violet-900'
                        : 'border-border hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedManagerIds.includes(m.id)}
                      onChange={() => toggleManager(m.id)}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-text">Agents / teams</p>
              <div className="flex flex-wrap gap-2">
                {agentsPool.map((a) => (
                  <label
                    key={a.id}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                      selectedAgentIds.includes(a.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedAgentIds.includes(a.id)}
                      onChange={() => toggleAgent(a.id)}
                    />
                    {a.name}
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
              Next: {STEPS[4]}
            </button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card
          title="Complete"
          description="Save as draft or complete the wizard — demo persists to browser storage."
        >
          <ul className="mb-6 space-y-2 text-sm text-muted">
            <li>
              <strong className="text-text">{name || '(unnamed)'}</strong> — {type},{' '}
              {selectedManagerIds.length} manager(s), {selectedAgentIds.length} agent(s).
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
                  <strong className="text-text">Call flow (AI)</strong>
                  <span className="text-muted"> — agent script builder</span>
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
              onClick={() => finish('complete')}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              Complete campaign
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
