import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { LegacyCard as Card } from '../components/ui/LegacyCard'
import { ChartContainer } from '../components/ui/ChartContainer'
import { useAuth } from '../hooks/useAuth'
import { useUsers } from '../hooks/useUsers'
import {
  presenceStatus,
  type ManagedUser,
  type PresenceStatus,
  type UserPermissions,
  type UserRole,
} from '../lib/usersApi'
import {
  createUserNote,
  deleteUserNote,
  fetchUserNotes,
  type UserNote,
} from '../lib/notesApi'
import { callReportCampaigns, callReports, initialScripts } from '../mock/data'
import { callAgentLabelForUser } from '../mock/userProfileBridge'
import { CallReports } from './CallReports'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  ANALYST: 'Analyst',
}

const STATUS_LABEL: Record<PresenceStatus, string> = {
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

export function UserProfile() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const userId = params.id ?? ''
  const onBack = () => navigate('/users')
  const { user: me } = useAuth()
  const { users, updateRole, updatePermissions, resetPassword } = useUsers()

  const subject = useMemo<ManagedUser | null>(
    () => users.find((u) => u.id === userId) ?? null,
    [users, userId],
  )

  const agentLabel = subject ? callAgentLabelForUser(subject.id, subject.name) : ''

  const myCalls = useMemo(
    () => (agentLabel ? callReports.filter((r) => r.agent === agentLabel) : []),
    [agentLabel],
  )

  const [tab, setTab] = useState<ProfileTab>('overview')
  const [notes, setNotes] = useState<UserNote[]>([])
  const [notesLoaded, setNotesLoaded] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)

  const [permDraft, setPermDraft] = useState<UserPermissions | undefined>(subject?.permissions)
  const [roleDraft, setRoleDraft] = useState<UserRole | undefined>(subject?.role)
  const [rolesBusy, setRolesBusy] = useState(false)

  useEffect(() => {
    setPermDraft(subject?.permissions)
    setRoleDraft(subject?.role)
  }, [subject])

  useEffect(() => {
    let cancelled = false
    setNotesLoaded(false)
    fetchUserNotes(userId)
      .then((list) => {
        if (!cancelled) {
          setNotes(list)
          setNotesLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setNotesLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

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
    return [...users]
      .map((u) => ({
        id: u.id,
        name: u.name,
        conv: u.stats.conversionPct,
        ai: u.stats.avgAiScore,
        calls: u.stats.callsHandled,
      }))
      .sort((a, b) => b.conv - a.conv)
      .map((row, i) => ({ ...row, rank: i + 1 }))
  }, [users])

  const teamPeers = useMemo(() => {
    return users.filter((u) => u.id !== userId && u.role === 'AGENT').slice(0, 6)
  }, [users, userId])

  const weeklyConvTarget = 12
  const callsProgress = Math.min(100, Math.round(((subject?.stats.callsHandled ?? 0) % 200) / 2))
  const convProgress = Math.min(
    100,
    Math.round(((subject?.stats.conversionPct ?? 0) / weeklyConvTarget) * 100),
  )

  const addNote = useCallback(async () => {
    const body = noteDraft.trim()
    if (!body) {
      toast.error('Write a note first')
      return
    }
    setNoteBusy(true)
    try {
      const created = await createUserNote(userId, body)
      setNotes((prev) => [created, ...prev])
      setNoteDraft('')
      toast.success('Note saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save note')
    } finally {
      setNoteBusy(false)
    }
  }, [noteDraft, userId])

  const removeNote = useCallback(
    async (noteId: string) => {
      try {
        await deleteUserNote(userId, noteId)
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not delete note')
      }
    },
    [userId],
  )

  const saveRoles = useCallback(async () => {
    if (!subject || !roleDraft || !permDraft) return
    setRolesBusy(true)
    try {
      if (roleDraft !== subject.role) {
        await updateRole(subject.id, roleDraft)
      }
      await updatePermissions(subject.id, permDraft)
      toast.success('Role and permissions saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save changes')
    } finally {
      setRolesBusy(false)
    }
  }, [subject, roleDraft, permDraft, updateRole, updatePermissions])

  const sendPasswordReset = useCallback(async () => {
    if (!subject) return
    try {
      const temp = await resetPassword(subject.id)
      toast.success(`Password reset to ${temp}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reset password')
    }
  }, [subject, resetPassword])

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

  const presence = presenceStatus(subject)

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
            {STATUS_LABEL[presence]}
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
            <ResponsiveContainer>
              <LineChart data={callsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Conversion trend (4w, simulated)" height={240}>
            <ResponsiveContainer>
              <BarChart data={convTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pct" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {tab === 'calls' && (
        <CallReports filterAgent={agentLabel} title={`Calls handled by ${subject.name}`} />
      )}

      {tab === 'ai' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="AI strengths">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {aiCoaching.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title="Coaching opportunities">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {aiCoaching.weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title="Frequent objections">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {aiCoaching.objections.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title="Suggested drills">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {aiCoaching.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'scripts' && (
        <Card title="Script usage" description={`Preferred script: ${preferredScript}`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2">Campaign</th>
                <th className="pb-2 tabular-nums">Calls</th>
                <th className="pb-2 tabular-nums">Conv. %</th>
              </tr>
            </thead>
            <tbody>
              {scriptUsageRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-2 text-muted">
                    No matching call rows for this agent in the mock data.
                  </td>
                </tr>
              )}
              {scriptUsageRows.map((r) => (
                <tr key={r.name} className="border-b border-border/70">
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.calls}</td>
                  <td className="py-2 tabular-nums">{r.convPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">
            Reference: campaigns {callReportCampaigns.length}, scripts library {initialScripts.length}.
          </p>
        </Card>
      )}

      {tab === 'goals' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Daily calls">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-primary"
                style={{ width: `${callsProgress}%` }}
                aria-label="Calls progress"
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              Calls handled: {subject.stats.callsHandled}
            </p>
          </Card>
          <Card title="Weekly conversion">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${convProgress}%` }}
                aria-label="Conversion progress"
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              Achievement vs goal: {convProgress}% (based on directory conversion %)
            </p>
          </Card>
        </div>
      )}

      {tab === 'notes' && (
        <Card title="Notes & feedback" description="Persisted on the server, visible to admins only.">
          <div className="space-y-3">
            <textarea
              className="w-full rounded-lg border border-border p-3 text-sm"
              rows={3}
              placeholder="Add coaching notes…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void addNote()}
              disabled={noteBusy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {noteBusy ? 'Saving…' : 'Save note'}
            </button>
            <ul className="space-y-2">
              {!notesLoaded ? (
                <li className="text-sm text-muted">Loading…</li>
              ) : notes.length === 0 ? (
                <li className="text-sm text-muted">No notes yet.</li>
              ) : (
                notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-border bg-slate-50/80 px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-text">{n.body}</p>
                      <button
                        type="button"
                        onClick={() => void removeNote(n.id)}
                        className="shrink-0 text-xs text-muted hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {n.authorName ?? 'Unknown'} · {formatTs(n.createdAt)}
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
                onChange={(e) => setRoleDraft(e.target.value as UserRole)}
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
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
              onClick={() => void saveRoles()}
              disabled={rolesBusy}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {rolesBusy ? 'Saving…' : 'Save changes'}
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
        <Card title="Security">
          <p className="mb-3 text-sm text-muted">
            Reset this user's password to a known temporary value. They can change it after they log in.
          </p>
          <button
            type="button"
            onClick={() => void sendPasswordReset()}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Send password reset
          </button>
          <p className="mt-4 text-xs text-muted">
            Notification + UI preferences are self-service. Users can manage them from their own
            "My Profile" page.
          </p>
        </Card>
      )}

      {tab === 'team' && (
        <Card title="Team / group" description="Other agents in the directory.">
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
