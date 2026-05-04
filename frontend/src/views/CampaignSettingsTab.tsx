import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import {
  generateAgentSoundboard,
  generateCampaignFromDescription,
  regenerateSoundboardSection,
  type CallFlowComplexity,
} from '../lib/campaignAiMock'
import { CALL_FLOW_SECTIONS, TIMEZONES, updateSoundboardLine } from '../lib/campaignCallFlowShared'
import { listKnownAgents, updateCampaign } from '../mock/campaignsStore'
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

function cloneBundle(b: AgentSoundboardBundle | undefined): AgentSoundboardBundle | null {
  if (!b) return null
  try {
    return structuredClone(b)
  } catch {
    return JSON.parse(JSON.stringify(b)) as AgentSoundboardBundle
  }
}

export function CampaignSettingsTab({ campaign }: { campaign: ManagedCampaign }) {
  const agentsPool = useMemo(() => [...listKnownAgents()], [])

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

  const [selectedAgents, setSelectedAgents] = useState<string[]>(() =>
    campaign.assignedAgents.length ? [...campaign.assignedAgents] : agentsPool.slice(0, 2),
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
    setSelectedAgents(
      campaign.assignedAgents.length ? [...campaign.assignedAgents] : agentsPool.slice(0, 2),
    )
    setCallLimitDaily(campaign.callLimitDaily)
    setPacingSecondsBetweenCalls(campaign.pacingSecondsBetweenCalls)
  }, [campaign, agentsPool])

  function toggleAgent(a: string) {
    setSelectedAgents((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
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
    updateCampaign(campaign.id, {
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
      assignedAgents: selectedAgents.length ? selectedAgents : agentsPool.slice(0, 2),
      callLimitDaily,
      pacingSecondsBetweenCalls,
      scriptId: scriptSource === 'library' ? scriptId : null,
      scriptName: scriptSource === 'library' ? scriptMeta?.name ?? null : null,
      abScriptId: scriptSource === 'library' ? abScriptId || null : null,
      agentSoundboard: scriptSource === 'soundboard' ? soundboardBundle ?? undefined : undefined,
    })
    toast.success('Campaign settings saved')
  }

  function setLifecycle(next: CampaignLifecycleState) {
    updateCampaign(campaign.id, { status: next })
    setStatus(next)
    toast.success(`Status → ${STATUS_LABEL[next]}`)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        General campaign fields, scripts (library or AI call flow), agents, and dialing limits —
        same options as the create wizard. Use <strong className="text-text">Save settings</strong>{' '}
        below to persist changes.
      </p>

      <Card
        title="General"
        description="Name, brief, channel type, schedule, timezone, and lifecycle status."
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
          <label className="block text-sm md:col-span-2">
            <span className="text-muted">Description (brief)</span>
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Plain-language campaign brief — drives mock AI for goal/tone and call-flow generation."
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
      </Card>

      <Card
        title="Scripts & call flow"
        description="Library scripts or the agent script builder (mock AI) — same as the wizard Call Flow step."
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
      </Card>

      <Card title="Agents & dialing" description="Roster and pacing — same as the wizard Resources step.">
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
                onChange={(e) => setPacingSecondsBetweenCalls(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveConfiguration}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          Save settings
        </button>
      </div>

      <Card title="Lifecycle shortcuts">
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
          Draft → scheduled → active → paused ↔ active → completed → archived. Status above is
          saved with <strong className="text-text">Save settings</strong>; these buttons update
          immediately.
        </p>
      </Card>
    </div>
  )
}
