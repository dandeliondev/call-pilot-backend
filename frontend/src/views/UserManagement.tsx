import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { useMockAuth } from '../hooks/useMockAuth'
import type { MockPublicUser, MockRole, UserStatus } from '../mock/usersStore'

const ROLE_LABELS: Record<MockRole, string> = {
  ADMIN: 'Admin (full control)',
  MANAGER: 'Manager (reports + campaigns)',
  AGENT: 'Agent (call app)',
  ANALYST: 'Analyst (read-only insights)',
}

const STATUS_UI: Record<
  UserStatus,
  { label: string; emoji: string; className: string }
> = {
  active: { label: 'Active', emoji: '🟢', className: 'bg-emerald-50 text-emerald-900 ring-emerald-100' },
  offline: { label: 'Offline', emoji: '⚪', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
  disabled: { label: 'Disabled', emoji: '🔴', className: 'bg-red-50 text-red-900 ring-red-100' },
}

const AI_AGENT_INSIGHTS: Record<string, string> = {
  u_seed_agent:
    'Agent Smith shows strong engagement scores but trails peers on explicit closing asks — coach micro-closes after minute two.',
  u_seed_admin:
    'Admin account — primarily QA sampling; conversion reflects blended outbound spot-checks.',
}

function formatTs(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

interface UserManagementProps {
  onOpenProfile: (userId: string) => void
}

export function UserManagement({ onOpenProfile }: UserManagementProps) {
  const {
    directory,
    updateUserRole,
    updateUserPermissions,
    setUserStatus,
    inviteUser,
    updateUserName,
    resetUserPassword,
    bulkSetRole,
    bulkSetStatus,
    importUsersFromCsv,
    resetDemoData,
    user: me,
  } = useMockAuth()

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<MockRole | ''>('')
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MockRole>('AGENT')
  const [inviteSendLink, setInviteSendLink] = useState(true)

  const [editUser, setEditUser] = useState<MockPublicUser | null>(null)
  const [editName, setEditName] = useState('')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return directory.filter((u) => {
      if (filterRole && u.role !== filterRole) return false
      if (filterStatus && u.status !== filterStatus) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    })
  }, [directory, search, filterRole, filterStatus])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(filtered.map((u) => u.id)))
  }

  function saveEdit() {
    if (!editUser) return
    updateUserName(editUser.id, editName)
    updateUserPermissions(editUser.id, editPerms)
    setEditUser(null)
  }

  const [editPerms, setEditPerms] = useState({
    editScripts: false,
    createCampaigns: false,
    viewReports: false,
    aiInsights: false,
  })

  function openEditModal(u: MockPublicUser) {
    setEditUser(u)
    setEditName(u.name)
    setEditPerms({ ...u.permissions })
  }

  function closeEdit() {
    setEditUser(null)
  }

  function submitInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Name and email are required')
      return
    }
    inviteUser({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      sendInvite: inviteSendLink,
    })
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('AGENT')
    setInviteSendLink(true)
  }

  function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const n = importUsersFromCsv(text)
      toast.message(`Imported ${n} user(s) (CSV)`)
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const bulkIds = [...selected]

  return (
    <div className="space-y-6">
      <Card
        title="User management"
        description="Directory stored in the browser (v2). CSV import: header row then name,email,role (admin | manager | agent | analyst)."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            Signed in as <strong>{me?.email}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
            >
              + Invite user
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
            >
              Import CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onImportFile}
            />
            <button
              type="button"
              onClick={resetDemoData}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
            >
              Reset demo users
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={filterRole}
            onChange={(e) => setFilterRole((e.target.value || '') as MockRole | '')}
          >
            <option value="">All roles</option>
            {(Object.keys(ROLE_LABELS) as MockRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus((e.target.value || '') as UserStatus | '')}
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_UI) as UserStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_UI[s].emoji} {STATUS_UI[s].label}
              </option>
            ))}
          </select>
        </div>

        {bulkIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <span className="font-medium text-amber-950">{bulkIds.length} selected</span>
            <select
              className="rounded-md border border-border bg-white px-2 py-1 text-xs"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as MockRole
                if (v) bulkSetRole(bulkIds, v)
                e.target.value = ''
              }}
            >
              <option value="">Bulk set role…</option>
              {(Object.keys(ROLE_LABELS) as MockRole[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-md border border-border bg-white px-2 py-1 text-xs"
              onClick={() => bulkSetStatus(bulkIds, 'disabled')}
            >
              Disable selected
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-white px-2 py-1 text-xs"
              onClick={() => bulkSetStatus(bulkIds, 'active')}
            >
              Activate selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 pr-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={
                      filtered.length > 0 && selected.size === filtered.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="pb-2 pr-3 font-medium">User</th>
                <th className="pb-2 pr-3 font-medium">Role</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Calls</th>
                <th className="pb-2 pr-3 font-medium">Conv.</th>
                <th className="pb-2 pr-3 font-medium">AI</th>
                <th className="pb-2 pr-3 font-medium">Last active</th>
                <th className="pb-2 pr-3 font-medium">Sessions</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const st = STATUS_UI[u.status]
                return (
                  <tr key={u.id} className="border-b border-border/80">
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        aria-label={`Select ${u.name}`}
                      />
                    </td>
                    <td className="py-2 pr-3 align-top">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(u.id)}
                        className="text-left font-medium text-text underline-offset-2 hover:text-primary hover:underline"
                      >
                        {u.name}
                      </button>
                      <p className="text-xs text-muted">{u.email}</p>
                      {u.invitePending && (
                        <span className="mt-1 inline-block rounded bg-violet-100 px-1.5 text-[10px] font-medium text-violet-900">
                          Invite pending
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 align-top">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateUserRole(u.id, e.target.value as MockRole)
                        }
                        className="max-w-[11rem] rounded-lg border border-border px-2 py-1 text-xs"
                      >
                        {(Object.keys(ROLE_LABELS) as MockRole[]).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${st.className}`}
                      >
                        {st.emoji} {st.label}
                      </span>
                    </td>
                    <td className="py-2 pr-3 align-top tabular-nums">
                      {u.stats.callsHandled.toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 align-top tabular-nums">
                      {u.stats.conversionPct}%
                    </td>
                    <td className="py-2 pr-3 align-top tabular-nums">
                      {u.stats.avgAiScore}
                    </td>
                    <td className="py-2 pr-3 align-top text-xs text-muted">
                      {formatTs(u.activity.lastActiveAt)}
                    </td>
                    <td className="py-2 pr-3 align-top tabular-nums text-xs">
                      {u.activity.sessionsToday}
                      <span className="block text-muted">
                        Last login: {formatTs(u.activity.lastLoginAt)}
                      </span>
                      <span className="block text-muted">
                        Last call: {formatTs(u.activity.lastCallAt)}
                      </span>
                    </td>
                    <td className="py-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-slate-50"
                          onClick={() => openEditModal(u)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-slate-50"
                          onClick={() =>
                            setUserStatus(
                              u.id,
                              u.status === 'disabled' ? 'active' : 'disabled',
                            )
                          }
                        >
                          {u.status === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                        <button
                          type="button"
                          className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-slate-50"
                          onClick={() => resetUserPassword(u.id)}
                        >
                          Reset PW
                        </button>
                        <button
                          type="button"
                          className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-slate-50"
                          onClick={() => onOpenProfile(u.id)}
                        >
                          Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">No users match filters.</p>
        )}
      </Card>

      <Card title="🧠 Agent insights (AI)" description="Demo coaching hints tied to user IDs.">
        <ul className="space-y-2 text-sm">
          {directory.filter((u) => AI_AGENT_INSIGHTS[u.id]).map((u) => (
            <li
              key={u.id}
              className="rounded-lg border border-border bg-slate-50 px-3 py-2"
            >
              <span className="font-medium text-text">{u.name}: </span>
              <span className="text-muted">{AI_AGENT_INSIGHTS[u.id]}</span>
            </li>
          ))}
          {directory.every((u) => !AI_AGENT_INSIGHTS[u.id]) && (
            <li className="text-muted">No AI insights for current directory.</li>
          )}
        </ul>
      </Card>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite user"
        size="lg"
      >
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="text-muted">Name</span>
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-muted">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-muted">Role</span>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MockRole)}
            >
              {(Object.keys(ROLE_LABELS) as MockRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={inviteSendLink}
              onChange={(e) => setInviteSendLink(e.target.checked)}
            />
            <span>Send invite link (demo — URL shown in toast)</span>
          </label>
          <button
            type="button"
            onClick={submitInvite}
            className="w-full rounded-xl bg-primary py-2.5 font-semibold text-white hover:opacity-95"
          >
            Add user
          </button>
        </div>
      </Modal>

      <Modal
        open={!!editUser}
        onClose={closeEdit}
        title={editUser ? `Edit ${editUser.email}` : 'Edit'}
        size="lg"
      >
        {editUser && (
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="text-muted">Display name</span>
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <div>
              <p className="mb-2 font-medium text-text">Permissions</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ['editScripts', 'Edit scripts'],
                    ['createCampaigns', 'Create campaigns'],
                    ['viewReports', 'View reports'],
                    ['aiInsights', 'AI insights'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editPerms[key]}
                      onChange={(e) =>
                        setEditPerms((p) => ({
                          ...p,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={saveEdit}
              className="w-full rounded-xl bg-primary py-2.5 font-semibold text-white hover:opacity-95"
            >
              Save
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
