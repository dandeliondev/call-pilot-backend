import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LegacyCard as Card } from '../components/ui/LegacyCard'
import {
  generateAgentSoundboard,
  generateCampaignFromDescription,
  regenerateSoundboardSection,
  type CallFlowComplexity,
} from '../lib/campaignAiMock'
import { CALL_FLOW_SECTIONS, TIMEZONES, updateSoundboardLine } from '../lib/campaignCallFlowShared'
import { useCampaignsContext } from '../hooks/useCampaigns'
import { initialScripts } from '../mock/data'
import type {
  AgentSoundboardBundle,
  CampaignLifecycleState,
  ManagedCampaign,
  RegenerableSoundboardSection,
  SoundboardPanel,
} from '../types/app'

const STATUS_LABEL: Record<CampaignLifecycleState, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Sub-steps aligned with the create-campaign wizard. */
const SETTINGS_STEPS = [
  'Describe',
  'Configure',
  'Call Flow & Responses',
  'Resources',
  'Complete',
] as const

type SettingsSubStep = 0 | 1 | 2 | 3 | 4

function cloneBundle(b: AgentSoundboardBundle | undefined): AgentSoundboardBundle | null {
  if (!b) return null
  try {
    return structuredClone(b)
  } catch {
    return JSON.parse(JSON.stringify(b)) as AgentSoundboardBundle
  }
}

export function CampaignSettingsTab({ campaign }: { campaign: ManagedCampaign }) {
  const { agents: agentsPool, managers: managersPool, updateCampaign } = useCampaignsContext()

  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description)
  const [type, setType] = useState<ManagedCampaign['type']>(campaign.type)
  const [timezone, setTimezone] = useState(campaign.timezone)
  const [scheduleLocal, setScheduleLocal] = useState(() =>
    campaign.scheduleStart ? campaign.scheduleStart.slice(0, 16) : '',
  )
  const [status, setStatus] = useState<CampaignLifecycleState>(campaign.status)

  const [campaignGoal, setCampaignGoal] = useState(campaign.aiObjective)
  const [wizardTone, setWizardTone] = useState(campaign.aiTone)
  const [complexity, setComplexity] = useState<CallFlowComplexity>(
    campaign.callFlowComplexity ?? 'basic',
  )

  const [scriptSource, setScriptSource] = useState<'library' | 'soundboard'>(() =>
    campaign.agentSoundboard ? 'soundboard' : 'library',
  )
  const [scriptId, setScriptId] = useState(campaign.scriptId ?? 's1')
  const [abScriptId, setAbScriptId] = useState(campaign.abScriptId ?? '')
  const [soundboardBundle, setSoundboardBundle] = useState<AgentSoundboardBundle | null>(() =>
    cloneBundle(campaign.agentSoundboard),
  )

  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>(() =>
    campaign.assignedAgents.map((a) => a.id),
  )
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>(() =>
    campaign.assignedCampaignManagers.map((m) => m.id),
  )
  const [callLimitDaily, setCallLimitDaily] = useState(campaign.callLimitDaily)
  const [pacingSecondsBetweenCalls, setPacingSecondsBetweenCalls] = useState(
    campaign.pacingSecondsBetweenCalls,
  )

  const [aiBusy, setAiBusy] = useState<'full' | RegenerableSoundboardSection | null>(null)
  const [openFlowSections, setOpenFlowSections] = useState<Record<string, boolean>>({
    intro: true,
    pitch: true,
  })

  const [subStep, setSubStep] = useState<SettingsSubStep>(0)

  useEffect(() => {
    setSubStep(0)
  }, [campaign.id])

  useEffect(() => {
    setName(campaign.name)
    setDescription(campaign.description)
    setType(campaign.type)
    setTimezone(campaign.timezone)
    setScheduleLocal(campaign.scheduleStart ? campaign.scheduleStart.slice(0, 16) : '')
    setStatus(campaign.status)
    setCampaignGoal(campaign.aiObjective)
    setWizardTone(campaign.aiTone)
    setComplexity(campaign.callFlowComplexity ?? 'basic')
    setScriptSource(campaign.agentSoundboard ? 'soundboard' : 'library')
    setScriptId(campaign.scriptId ?? 's1')
    setAbScriptId(campaign.abScriptId ?? '')
    setSoundboardBundle(cloneBundle(campaign.agentSoundboard))
    setSelectedAgentIds(campaign.assignedAgents.map((a) => a.id))
    setSelectedManagerIds(campaign.assignedCampaignManagers.map((m) => m.id))
    setCallLimitDaily(campaign.callLimitDaily)
    setPacingSecondsBetweenCalls(campaign.pacingSecondsBetweenCalls)
  }, [campaign])

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

  function soundboardInput() {
    const derived = generateCampaignFromDescription(description)
    return {
      description,
      audience: derived.audience,
      objective: campaignGoal.trim() || derived.objective,
      tone: wizardTone.trim() || derived.tone,
      complexity,
    }
  }

  async function runGenerateFullCallFlow() {
    if (!description.trim()) {
      toast.error('Add a campaign description (brief) first.')
      return
    }
    setAiBusy('full')
    try {
      await delay(500)
      const bundle = generateAgentSoundboard(soundboardInput())
      setSoundboardBundle(bundle)
      setOpenFlowSections((prev) => ({ ...prev, intro: true, pitch: true }))
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
        soundboardInput(),
      )
      setSoundboardBundle(next)
      setOpenFlowSections((prev) => ({ ...prev, [section]: true }))
      const label = CALL_FLOW_SECTIONS.find((s) => s.id === section)?.heading ?? section
      toast.message(`${label} refreshed`)
    } finally {
      setAiBusy(null)
    }
  }

  function syncGoalToneFromDescription() {
    const t = description.trim()
    if (!t) {
      toast.error('Add a description first.')
      return
    }
    const d = generateCampaignFromDescription(t)
    setCampaignGoal(d.objective)
    setWizardTone(d.tone)
    toast.success('Goal and tone updated from your description.')
  }

  function saveConfiguration() {
    if (!name.trim()) {
      toast.error('Campaign name is required.')
      return
    }
    if (scriptSource === 'soundboard' && !soundboardBundle) {
      toast.error('Generate the call flow or switch to a library script before saving.')
      return
    }
    const derived = generateCampaignFromDescription(description)
    const scriptMeta = initialScripts.find((s) => s.id === scriptId)
    const selectedAgents = agentsPool.filter((u) => selectedAgentIds.includes(u.id))
    const selectedManagers = managersPool.filter((u) => selectedManagerIds.includes(u.id))
    void updateCampaign(campaign.id, {
      name: name.trim(),
      description: description.trim(),
      type,
      timezone,
      scheduleStart: scheduleLocal ? new Date(scheduleLocal).toISOString() : null,
      status,
      aiAudience: derived.audience,
      aiObjective: campaignGoal.trim() || derived.objective,
      aiSuggestedScript: derived.suggestedScript,
      aiTone: wizardTone.trim() || derived.tone,
      callFlowComplexity: complexity,
      assignedAgents: selectedAgents,
      assignedCampaignManagers: selectedManagers,
      callLimitDaily,
      pacingSecondsBetweenCalls,
      scriptId: scriptSource === 'library' ? scriptId : null,
      scriptName: scriptSource === 'library' ? scriptMeta?.name ?? null : null,
      abScriptId: scriptSource === 'library' ? abScriptId || null : null,
      agentSoundboard: scriptSource === 'soundboard' ? soundboardBundle ?? undefined : undefined,
    })
      .then(() => toast.success('Campaign settings saved'))
      .catch(() => toast.error('Could not save campaign settings'))
  }

  function setLifecycle(next: CampaignLifecycleState) {
    void updateCampaign(campaign.id, { status: next })
      .then(() => {
        setStatus(next)
        toast.success(`Status → ${STATUS_LABEL[next]}`)
      })
      .catch(() => toast.error('Could not update status'))
  }

  function goNext() {
    setSubStep((s) => (s < 4 ? ((s + 1) as SettingsSubStep) : s))
  }

  function goBack() {
    setSubStep((s) => (s > 0 ? ((s - 1) as SettingsSubStep) : s))
  }

  const scriptMeta = initialScripts.find((s) => s.id === scriptId)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Same flow as the create wizard — move between steps, then save on{' '}
        <strong className="text-text">Complete</strong>.
      </p>

      <div className="flex flex-wrap gap-1">
        {SETTINGS_STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setSubStep(i as SettingsSubStep)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === subStep ? 'bg-primary text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {subStep === 0 && (
        <Card
          title="Describe"
          description="Plain-language brief — drives mock AI for goal, tone, and call-flow generation on the next steps."
        >
          <label className="block text-sm">
            <span className="text-muted">Campaign description</span>
            <textarea
              className="mt-1 min-h-[160px] w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='e.g. "Outbound campaign to offer renewal discount for expired subscriptions"'
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={goNext}
              disabled={!description.trim()}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next: {SETTINGS_STEPS[1]}
            </button>
          </div>
        </Card>
      )}

      {subStep === 1 && (
        <Card
          title="Configure"
          description="Name, channel type, schedule, timezone, and lifecycle status."
        >
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
                onChange={(e) => setType(e.target.value as ManagedCampaign['type'])}
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">Next start (local)</span>
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
            <label className="block text-sm md:col-span-2">
              <span className="text-muted">Lifecycle status</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignLifecycleState)}
              >
                {(Object.keys(STATUS_LABEL) as CampaignLifecycleState[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: {SETTINGS_STEPS[2]}
            </button>
          </div>
        </Card>
      )}

      {subStep === 2 && (
        <Card
          title={SETTINGS_STEPS[2]}
          description="Library scripts or the agent script builder (mock AI) — same as the wizard."
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
                  disabled={!description.trim() || aiBusy !== null}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                >
                  {aiBusy === 'full' ? 'Generating…' : 'Generate full call flow'}
                </button>
                <button
                  type="button"
                  onClick={syncGoalToneFromDescription}
                  disabled={!description.trim() || aiBusy !== null}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text hover:bg-slate-50 disabled:opacity-40"
                >
                  Sync goal & tone from description
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm md:col-span-1">
                  <span className="font-medium text-text">Campaign goal</span>
                  <textarea
                    className="mt-1 min-h-[88px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    placeholder="e.g. Book renewal review, recover win-back…"
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
                    onChange={(e) => setComplexity(e.target.value as CallFlowComplexity)}
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
                            onClick={() => setOpenFlowSections((s) => ({ ...s, [id]: !open }))}
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
                              <label
                                key={`${id}-${line.shortcut}-${idx}`}
                                className="block text-xs"
                              >
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
              onClick={goBack}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: {SETTINGS_STEPS[3]}
            </button>
          </div>
        </Card>
      )}

      {subStep === 3 && (
        <Card
          title={SETTINGS_STEPS[3]}
          description="Campaign managers, agents, and dialing limits — same as the wizard Resources step."
        >
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-text">Campaign managers</p>
            <p className="mb-2 text-xs text-muted">
              Oversight, approvals, and reporting contacts (demo roster).
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
                onChange={(e) => setPacingSecondsBetweenCalls(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </div>
          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next: {SETTINGS_STEPS[4]}
            </button>
          </div>
        </Card>
      )}

      {subStep === 4 && (
        <Card
          title={SETTINGS_STEPS[4]}
          description="Review, save all changes to storage, or use lifecycle shortcuts (immediate)."
        >
          <ul className="mb-6 space-y-2 text-sm text-muted">
            <li>
              <strong className="text-text">{name.trim() || '(unnamed)'}</strong> — {type},{' '}
              {selectedManagerIds.length} manager(s), {selectedAgentIds.length} agent(s).
              {scriptSource === 'library' ? (
                <>
                  {' '}
                  Script:{' '}
                  <strong className="text-text">{scriptMeta?.name ?? scriptId}</strong>
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
            <li>
              Status: <strong className="text-text">{STATUS_LABEL[status]}</strong> ·{' '}
              {timezone}
            </li>
          </ul>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveConfiguration}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Save settings
            </button>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <p className="mb-3 text-sm font-medium text-text">Lifecycle shortcuts</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => setLifecycle('paused')}
              >
                Pause
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => setLifecycle('active')}
              >
                Resume
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => setLifecycle('completed')}
              >
                Mark completed
              </button>
              <button
                type="button"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                onClick={() => setLifecycle('archived')}
              >
                Archive
              </button>
            </div>
            <p className="mt-4 text-xs text-muted">
              Draft → scheduled → active → paused ↔ active → completed → archived. Lifecycle
              buttons update status immediately; other fields use <strong className="text-text">Save settings</strong>.
            </p>
          </div>

          <div className="mt-6 flex justify-start">
            <button
              type="button"
              onClick={goBack}
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
