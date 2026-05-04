import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { ChartContainer } from '../components/ui/ChartContainer'
import { useMockAuth } from '../hooks/useMockAuth'
import { callReports, initialScripts } from '../mock/data'
import { callAgentLabelForUser } from '../mock/userProfileBridge'
import type { MockPublicUser, MockRole } from '../mock/usersStore'
import { CallReports } from './CallReports'

const ROLE_LABELS: Record<MockRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  ANALYST: 'Analyst',
}

const STATUS_LABEL: Record<MockPublicUser['status'], string> = {
  active: 'Active',
  offline: 'Offline',
  disabled: 'Disabled',
}

type ProfileTab =
  | 'overview'
  | 'performance'
  | 'calls'
  | 'ai'
  | 'scripts'
  | 'goals'
  | 'notes'
  | 'roles'
  | 'activity'
  | 'settings'
  | 'team'
  | 'leaderboard'
  | 'training'

const TABS: { id: ProfileTab; label: string; group?: 'main' | 'extra' }[] = [
  { id: 'overview', label: 'Overview', group: 'main' },
  { id: 'performance', label: 'Performance', group: 'main' },
  { id: 'calls', label: 'Call History', group: 'main' },
  { id: 'ai', label: 'AI Insights', group: 'main' },
  { id: 'scripts', label: 'Script Usage', group: 'main' },
  { id: 'goals', label: 'Goals & Targets', group: 'main' },
  { id: 'notes', label: 'Notes / Feedback', group: 'main' },
  { id: 'roles', label: 'Roles & Permissions', group: 'main' },
  { id: 'activity', label: 'Activity Log', group: 'main' },
  { id: 'settings', label: 'Settings', group: 'main' },
  { id: 'team', label: 'Team', group: 'extra' },
  { id: 'leaderboard', label: 'Leaderboard', group: 'extra' },
  { id: 'training', label: 'Training', group: 'extra' },
]

const NOTES_KEY = 'callpilot_profile_notes_v1'
const SETTINGS_KEY = 'callpilot_profile_settings_v1'

type StoredNote = { id: string; body: string; at: string; author: string }
type StoredSettings = {
  emailDigest: boolean
  smsAlerts: boolean
  themePref: 'system' | 'light' | 'dark'
}

function loadNotes(userId: string): StoredNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const o = JSON.parse(raw) as Record<string, StoredNote[]>
    return o[userId] ?? []
  } catch {
    return []
  }
}

function saveNotes(userId: string, notes: StoredNote[]) {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    const o = raw ? (JSON.parse(raw) as Record<string, StoredNote[]>) : {}
    o[userId] = notes
    localStorage.setItem(NOTES_KEY, JSON.stringify(o))
  } catch {
    /* ignore */
  }
}

function loadSettings(userId: string): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) {
      return { emailDigest: true, smsAlerts: false, themePref: 'system' }
    }
    const o = JSON.parse(raw) as Record<string, StoredSettings>
    return o[userId] ?? { emailDigest: true, smsAlerts: false, themePref: 'system' }
  } catch {
    return { emailDigest: true, smsAlerts: false, themePref: 'system' }
  }
}

function saveSettings(userId: string, s: StoredSettings) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const o = raw ? (JSON.parse(raw) as Record<string, StoredSettings>) : {}
    o[userId] = s
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(o))
  } catch {
    /* ignore */
  }
}

function hashScores(userId: string) {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0
  const base = 68 + (Math.abs(h) % 22)
  return {
    greeting: Math.min(95, base + (Math.abs(h >> 3) % 12)),
    objection: Math.min(95, base - 4 + (Math.abs(h >> 5) % 10)),
    closing: Math.min(95, base - 8 + (Math.abs(h >> 7) % 14)),
  }
}

function formatTs(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

interface UserProfileProps {
  userId: string
  onBack: () => void
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const {
    directory,
    updateUserRole,
    updateUserPermissions,
    user: me,
    resetUserPassword,
  } = useMockAuth()

  const subject = useMemo(
    () => directory.find((u) => u.id === userId) ?? null,
    [directory, userId],
  )

  const agentLabel = subject
    ? callAgentLabelForUser(subject.id, subject.name)
    : ''

  const myCalls = useMemo(
    () => (agentLabel ? callReports.filter((r) => r.agent === agentLabel) : []),
    [agentLabel],
  )

  const [tab, setTab] = useState<ProfileTab>('overview')
  const [notes, setNotes] = useState<StoredNote[]>(() => loadNotes(userId))
  const [noteDraft, setNoteDraft] = useState('')
  const [settings, setSettings] = useState<StoredSettings>(() => loadSettings(userId))

  const [permDraft, setPermDraft] = useState(subject?.permissions)
  const [roleDraft, setRoleDraft] = useState(subject?.role)

  useEffect(() => {
    setNotes(loadNotes(userId))
    setSettings(loadSettings(userId))
    setPermDraft(subject?.permissions)
    setRoleDraft(subject?.role)
  }, [userId, subject])

  useEffect(() => {
    saveNotes(userId, notes)
  }, [userId, notes])

  useEffect(() => {
    saveSettings(userId, settings)
  }, [userId, settings])

  const scores = useMemo(() => hashScores(userId), [userId])

  const callsOverTime = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const r of myCalls) {
      const d = r.startedAt.slice(0, 10)
      byDay.set(d, (byDay.get(d) ?? 0) + 1)
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, calls]) => ({ day: day.slice(5), calls }))
  }, [myCalls])

  const convTrend = useMemo(() => {
    const weeks = ['W1', 'W2', 'W3', 'W4']
    const base = subject?.stats.conversionPct ?? 20
    return weeks.map((w, i) => ({
      week: w,
      pct: Math.max(8, Math.min(42, base + (i - 2) * 3 + ((userId.charCodeAt(0) ?? 0) % 5))),
    }))
  }, [subject, userId])

  const avgDurSec = useMemo(() => {
    if (myCalls.length === 0) return 0
    return myCalls.reduce((s, r) => s + r.durationSeconds, 0) / myCalls.length
  }, [myCalls])

  const scriptUsageRows = useMemo(() => {
    const map = new Map<string, { calls: number; booked: number }>()
    for (const r of myCalls) {
      const k = r.campaignName
      const cur = map.get(k) ?? { calls: 0, booked: 0 }
      cur.calls += 1
      if (r.outcome === 'Booked') cur.booked += 1
      map.set(k, cur)
    }
    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        calls: v.calls,
        convPct: v.calls ? Math.round((v.booked / v.calls) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.calls - a.calls)
  }, [myCalls])

  const preferredScript = scriptUsageRows[0]?.name ?? '—'

  const mockCampaignAssign =
    myCalls[0]?.campaignName ?? 'Outbound renewal — warm intro'

  const aiCoaching = useMemo(() => {
    const strengths =
      scores.closing >= scores.objection
        ? ['Strong rapport building', 'Clear product framing']
        : ['Consistent greeting compliance', 'Good discovery pacing']
    const weaknesses =
      scores.closing < 78
        ? ['Misses closing opportunities', 'Hesitation after price reveal']
        : ['Could deepen objection loops', 'Occasionally rushes qualification']
    const objections = ['Price too high', 'Need to talk to spouse', 'Happy with current carrier']
    const suggestions = [
      'Practice two-option closes on renewal calls.',
      'Mirror budget concerns before restating value.',
      'Use silence after the first anchor price.',
    ]
    return { strengths, weaknesses, objections, suggestions }
  }, [scores])

  const activityRows = useMemo(
    () => [
      { at: subject?.activity.lastLoginAt ?? new Date().toISOString(), action: 'Login', detail: 'Web session' },
      {
        at: subject?.activity.lastCallAt ?? new Date(Date.now() - 86400000).toISOString(),
        action: 'Call handled',
        detail: 'Outbound renewal queue',
      },
      { at: new Date(Date.now() - 172800000).toISOString(), action: 'View', detail: 'Reports — Calls' },
      { at: new Date(Date.now() - 259200000).toISOString(), action: 'Campaign', detail: 'Edited audience filter (demo)' },
    ],
    [subject],
  )

  const leaderboard = useMemo(() => {
    return [...directory]
      .map((u) => ({
        id: u.id,
        name: u.name,
        conv: u.stats.conversionPct,
        ai: u.stats.avgAiScore,
        calls: u.stats.callsHandled,
      }))
      .sort((a, b) => b.conv - a.conv)
      .map((row, i) => ({ ...row, rank: i + 1 }))
  }, [directory])

  const teamPeers = useMemo(() => {
    return directory.filter((u) => u.id !== userId && u.role === 'AGENT').slice(0, 6)
  }, [directory, userId])

  const dailyCallsTarget = 45
  const weeklyConvTarget = 12
  const callsProgress = Math.min(100, Math.round(((subject?.stats.callsHandled ?? 0) % 200) / 2))
  const convProgress = Math.min(
    100,
    Math.round(((subject?.stats.conversionPct ?? 0) / weeklyConvTarget) * 100),
  )

  const addNote = useCallback(() => {
    const body = noteDraft.trim()
    if (!body) {
      toast.error('Write a note first')
      return
    }
    const n: StoredNote = {
      id: crypto.randomUUID(),
      body,
      at: new Date().toISOString(),
      author: me?.name ?? 'Manager',
    }
    setNotes((prev) => [n, ...prev])
    setNoteDraft('')
    toast.success('Note saved')
  }, [noteDraft, me?.name])

  const saveRoles = useCallback(() => {
    if (!subject || !roleDraft || !permDraft) return
    updateUserRole(subject.id, roleDraft)
    updateUserPermissions(subject.id, permDraft)
  }, [subject, roleDraft, permDraft, updateUserRole, updateUserPermissions])

  if (!subject) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to directory
        </button>
        <Card title="User not found">This user is no longer in the directory.</Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-sm font-medium text-primary hover:underline"
          >
            ← User management
          </button>
          <h2 className="text-2xl font-semibold text-text">{subject.name}</h2>
          <p className="text-sm text-muted">{subject.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-text">
            {ROLE_LABELS[subject.role]}
          </span>
          <span className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium">
            {STATUS_LABEL[subject.status]}
          </span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {TABS.map(({ id, label, group }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
              tab === id
                ? 'bg-primary/10 text-primary'
                : group === 'extra'
                  ? 'text-muted hover:bg-slate-50'
                  : 'text-muted hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card title="Snapshot">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Team / campaign</dt>
                  <dd className="text-right font-medium">{mockCampaignAssign}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Last login</dt>
                  <dd className="text-right">{formatTs(subject.activity.lastLoginAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Last active</dt>
                  <dd className="text-right">{formatTs(subject.activity.lastActiveAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Sessions today</dt>
                  <dd className="text-right tabular-nums">{subject.activity.sessionsToday}</dd>
                </div>
              </dl>
            </Card>
            <Card title="Quick stats">
              <dl className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">Calls handled</dt>
                  <dd className="text-2xl font-semibold text-primary">
                    {subject.stats.callsHandled.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Conversion</dt>
                  <dd className="text-2xl font-semibold text-text">{subject.stats.conversionPct}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Avg AI score</dt>
                  <dd className="text-2xl font-semibold text-text">{subject.stats.avgAiScore}</dd>
                </div>
              </dl>
            </Card>
            <Card title="Coaching hint (demo)">
              <p className="text-sm text-muted">
                Open <strong>AI Insights</strong> for strengths/weaknesses, or{' '}
                <strong>Call History</strong> to review transcripts with evaluation.
              </p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Team snapshot" description="Peers with the Agent role (demo).">
              <ul className="space-y-2 text-sm">
                {teamPeers.length === 0 ? (
                  <li className="text-muted">No other agents in directory.</li>
                ) : (
                  teamPeers.map((u) => (
                    <li key={u.id} className="flex justify-between border-b border-border/60 py-2 last:border-0">
                      <span>{u.name}</span>
                      <span className="tabular-nums text-muted">{u.stats.conversionPct}% conv</span>
                    </li>
                  ))
                )}
              </ul>
            </Card>
            <Card title="Leaderboard preview" description="Ranked by conversion (directory stats).">
              <ol className="space-y-2 text-sm">
                {leaderboard.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span>
                      #{r.rank} {r.name}
                      {r.id === userId ? <span className="text-primary"> (you)</span> : null}
                    </span>
                    <span className="tabular-nums text-muted">{r.conv}%</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-muted">Avg call duration (this agent&apos;s calls)</p>
              <p className="mt-2 text-2xl font-semibold">
                {myCalls.length
                  ? `${Math.floor(avgDurSec / 60)}:${Math.round(avgDurSec % 60)
                      .toString()
                      .padStart(2, '0')}`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-muted">From filtered mock call rows</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">AI score breakdown (simulated)</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-muted">Greeting</p>
                  <p className="text-lg font-semibold text-primary">{scores.greeting}</p>
                </div>
                <div>
                  <p className="text-muted">Objections</p>
                  <p className="text-lg font-semibold text-primary">{scores.objection}</p>
                </div>
                <div>
                  <p className="text-muted">Closing</p>
                  <p className="text-lg font-semibold text-primary">{scores.closing}</p>
                </div>
              </div>
            </Card>
            <Card>
              <p className="text-sm text-muted">Conversion (directory)</p>
              <p className="mt-2 text-2xl font-semibold">{subject.stats.conversionPct}%</p>
            </Card>
          </div>

          <ChartContainer title="Calls over time (mock)" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={callsOverTime.length ? callsOverTime : [{ day: '—', calls: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Conversion rate trend (illustrative)" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 50]} />
                <Tooltip />
                <Line type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="AI pillar scores" description="Same dimensions as call evaluation." height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Greeting', score: scores.greeting },
                  { name: 'Objection handling', score: scores.objection },
                  { name: 'Closing', score: scores.closing },
                ]}
                layout="vertical"
                margin={{ left: 32, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {tab === 'calls' && (
        <CallReports lockAgentName={agentLabel || undefined} />
      )}

      {tab === 'ai' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Strengths">
            <ul className="list-disc space-y-2 pl-5 text-sm text-text">
              {aiCoaching.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title="Weaknesses">
            <ul className="list-disc space-y-2 pl-5 text-sm text-text">
              {aiCoaching.weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title="Common objections">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {aiCoaching.objections.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title="Suggested improvements">
            <ul className="list-disc space-y-1 pl-5 text-sm text-text">
              {aiCoaching.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'scripts' && (
        <div className="space-y-6">
          <Card
            title="Scripts used (via campaigns)"
            description="Aggregated from this agent’s mock calls — campaign name as a proxy for script line."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50">
                    <th className="px-3 py-2 font-semibold">Campaign / line</th>
                    <th className="px-3 py-2 font-semibold">Calls</th>
                    <th className="px-3 py-2 font-semibold">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {scriptUsageRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-muted">
                        No calls in mock dataset for this user&apos;s mapped agent.
                      </td>
                    </tr>
                  ) : (
                    scriptUsageRows.map((row) => (
                      <tr key={row.name} className="border-b border-border/80">
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2 tabular-nums">{row.calls}</td>
                        <td className="px-3 py-2 tabular-nums text-primary">{row.convPct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium text-text">Preferred script (by volume):</span> {preferredScript}
            </p>
          </Card>

          <Card title="Library reference (global)" description="Script Management metrics for comparison.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50">
                    <th className="px-3 py-2 font-semibold">Script</th>
                    <th className="px-3 py-2 font-semibold">Conversion</th>
                    <th className="px-3 py-2 font-semibold">Composite</th>
                  </tr>
                </thead>
                <tbody>
                  {initialScripts.map((s) => (
                    <tr key={s.id} className="border-b border-border/80">
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2 tabular-nums">{s.conversionPct}%</td>
                      <td className="px-3 py-2 tabular-nums">{s.performancePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'goals' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Daily target — calls">
            <p className="text-sm text-muted">Goal: {dailyCallsTarget} dial attempts</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${callsProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">Progress (demo): {callsProgress}%</p>
          </Card>
          <Card title="Weekly target — conversions">
            <p className="text-sm text-muted">Goal: {weeklyConvTarget} booked</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${convProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              Achievement vs goal: {convProgress}% (based on directory conversion %)
            </p>
          </Card>
        </div>
      )}

      {tab === 'notes' && (
        <Card title="Manager notes & coaching logs">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                className="min-h-[88px] flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Needs improvement in objection handling…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <button
                type="button"
                onClick={addNote}
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Add note
              </button>
            </div>
            <ul className="space-y-3">
              {notes.length === 0 ? (
                <li className="text-sm text-muted">No notes yet.</li>
              ) : (
                notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-border bg-slate-50/80 px-3 py-2 text-sm"
                  >
                    <p className="text-text">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">
                      {n.author} · {formatTs(n.at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </Card>
      )}

      {tab === 'roles' && (
        <Card title="Role & permissions">
          <div className="space-y-4 text-sm">
            <label className="block max-w-md">
              <span className="text-muted">Role</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={roleDraft ?? subject.role}
                onChange={(e) => setRoleDraft(e.target.value as MockRole)}
              >
                {(Object.keys(ROLE_LABELS) as MockRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['viewReports', 'View reports'],
                  ['editScripts', 'Edit scripts'],
                  ['createCampaigns', 'Manage campaigns'],
                  ['aiInsights', 'AI insights'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permDraft?.[key] ?? false}
                    onChange={(e) =>
                      setPermDraft((p) =>
                        p ? { ...p, [key]: e.target.checked } : p,
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={saveRoles}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:opacity-95"
            >
              Save changes
            </button>
          </div>
        </Card>
      )}

      {tab === 'activity' && (
        <Card title="Activity log" description="Illustrative audit trail for demo.">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Action</th>
                <th className="pb-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((row, i) => (
                <tr key={i} className="border-b border-border/70">
                  <td className="py-2 pr-3 text-xs text-muted whitespace-nowrap">
                    {formatTs(row.at)}
                  </td>
                  <td className="py-2 pr-3 font-medium">{row.action}</td>
                  <td className="py-2 text-muted">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Security">
            <p className="mb-3 text-sm text-muted">
              Password reset emails the user a demo link (same as directory action).
            </p>
            <button
              type="button"
              onClick={() => {
                resetUserPassword(subject.id)
                toast.message('Password reset (demo)')
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Send password reset
            </button>
          </Card>
          <Card title="Notifications">
            <label className="flex cursor-pointer items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={settings.emailDigest}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, emailDigest: e.target.checked }))
                }
              />
              Daily performance digest
            </label>
            <label className="flex cursor-pointer items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={settings.smsAlerts}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smsAlerts: e.target.checked }))
                }
              />
              SMS alerts for QA flags
            </label>
          </Card>
          <Card title="UI preferences">
            <label className="block text-sm">
              <span className="text-muted">Theme (demo — not wired to app shell)</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={settings.themePref}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    themePref: e.target.value as StoredSettings['themePref'],
                  }))
                }
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </Card>
        </div>
      )}

      {tab === 'team' && (
        <Card title="Team / group" description="Other agents in the demo directory.">
          <ul className="divide-y divide-border text-sm">
            {teamPeers.map((u) => (
              <li key={u.id} className="flex flex-wrap justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>{u.stats.callsHandled} calls</p>
                  <p>{u.stats.conversionPct}% conv · AI {u.stats.avgAiScore}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'leaderboard' && (
        <Card title="Leaderboard" description="Sorted by conversion rate (directory stats).">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2">#</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Conv.</th>
                <th className="pb-2">AI</th>
                <th className="pb-2">Calls</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr
                  key={r.id}
                  className={
                    r.id === userId ? 'border-b border-primary/30 bg-primary/5' : 'border-b border-border/70'
                  }
                >
                  <td className="py-2 font-medium">{r.rank}</td>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 tabular-nums">{r.conv}%</td>
                  <td className="py-2 tabular-nums">{r.ai}</td>
                  <td className="py-2 tabular-nums">{r.calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'training' && (
        <Card
          title="Training mode"
          description="Assign training scripts and track improvement — placeholder for LMS integration."
        >
          <p className="mb-4 text-sm text-muted">
            Next step: link assigned scripts from Script Management and compare AI scores week over week.
          </p>
          <button
            type="button"
            onClick={() => toast.message('Training assignment queued (demo)')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Assign renewal refresher
          </button>
        </Card>
      )}
    </div>
  )
}
