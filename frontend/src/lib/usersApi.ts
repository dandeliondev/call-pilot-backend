import { apiFetch } from './api'

export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'ANALYST'

export type UserStatus = 'active' | 'disabled'

export interface UserPermissions {
  editScripts: boolean
  createCampaigns: boolean
  viewReports: boolean
  aiInsights: boolean
}

export interface ManagedUser {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string | null
  status: UserStatus
  permissions: UserPermissions
  stats: {
    callsHandled: number
    conversionPct: number
    avgAiScore: number
  }
  activity: {
    lastLoginAt: string | null
    lastCallAt: string | null
    sessionsToday: number
    lastActiveAt: string | null
  }
  invitePending: boolean
  twoFactorEnabled: boolean
  emailVerifiedAt: string | null
}

interface DataEnvelope<T> {
  data: T
}

export interface UserListFilters {
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
}

export async function fetchUsers(filters: UserListFilters = {}): Promise<ManagedUser[]> {
  const qs = new URLSearchParams()
  if (filters.search) qs.set('search', filters.search)
  if (filters.role) qs.set('role', filters.role)
  if (filters.status) qs.set('status', filters.status)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const res = await apiFetch<DataEnvelope<ManagedUser[]>>(`/api/users${suffix}`)
  return res.data
}

export interface UpdateUserPatch {
  name?: string
  email?: string
  role?: UserRole
  status?: UserStatus
  permissions?: UserPermissions
}

export async function updateUser(id: string, patch: UpdateUserPatch): Promise<ManagedUser> {
  const res = await apiFetch<DataEnvelope<ManagedUser>>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return res.data
}

export interface ResetPasswordResponse {
  tempPassword: string
}

export async function resetUserPassword(id: string): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>(`/api/users/${id}/reset-password`, {
    method: 'POST',
  })
}

export interface BulkActionPayload {
  ids: string[]
  action: 'set_role' | 'set_status'
  value: string
}

export interface BulkActionResult {
  updated: number
  skipped: Array<{ id: number; reason: string }>
}

export async function bulkUserAction(payload: BulkActionPayload): Promise<BulkActionResult> {
  return apiFetch<BulkActionResult>('/api/users/bulk', {
    method: 'POST',
    body: JSON.stringify({
      ids: payload.ids.map((id) => Number(id)),
      action: payload.action,
      value: payload.value,
    }),
  })
}

export interface ImportResult {
  created: number
  skipped: number
}

export async function importUsers(file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<ImportResult>('/api/users/import', {
    method: 'POST',
    body: form,
  })
}

export interface InvitePayload {
  name: string
  email: string
  role: UserRole
  sendInvite: boolean
}

export interface InviteResponse {
  user: ManagedUser
  invitationLink: string
  expiresAt: string
}

export async function inviteUserApi(payload: InvitePayload): Promise<InviteResponse> {
  const res = await apiFetch<DataEnvelope<ManagedUser> & InviteResponse>('/api/invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return {
    user: (res as unknown as InviteResponse).user,
    invitationLink: res.invitationLink,
    expiresAt: res.expiresAt,
  }
}

/**
 * Activity-derived 'offline' presence — the backend stores only active|disabled.
 * Users we haven't seen for OFFLINE_AFTER_MS are surfaced as offline in the UI.
 */
const OFFLINE_AFTER_MS = 15 * 60 * 1000

export type PresenceStatus = UserStatus | 'offline'

export function presenceStatus(u: Pick<ManagedUser, 'status' | 'activity'>): PresenceStatus {
  if (u.status === 'disabled') return 'disabled'
  const last = u.activity.lastActiveAt
  if (!last) return 'offline'
  if (Date.now() - new Date(last).getTime() > OFFLINE_AFTER_MS) return 'offline'
  return 'active'
}
