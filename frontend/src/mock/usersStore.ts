/**
 * Demo-only user store (localStorage). Passwords are plain text in this mock — never for production.
 */

export type MockRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'ANALYST'

export type UserStatus = 'active' | 'offline' | 'disabled'

export interface UserPermissions {
  editScripts: boolean
  createCampaigns: boolean
  viewReports: boolean
  aiInsights: boolean
}

export interface UserPerfStats {
  callsHandled: number
  conversionPct: number
  avgAiScore: number
}

export interface UserActivity {
  lastLoginAt: string | null
  lastCallAt: string | null
  sessionsToday: number
  lastActiveAt: string | null
}

export interface MockStoredUser {
  id: string
  email: string
  name: string
  role: MockRole
  /** Demo mock only */
  password: string
  createdAt: string
  status: UserStatus
  permissions: UserPermissions
  stats: UserPerfStats
  activity: UserActivity
  /** Show “invite pending” badge (demo) */
  invitePending?: boolean
}

export type MockPublicUser = Omit<MockStoredUser, 'password'>

const KEY_USERS_V1 = 'callpilot_demo_users_v1'
const KEY_USERS = 'callpilot_demo_users_v2'

export function defaultPermissions(role: MockRole): UserPermissions {
  switch (role) {
    case 'ADMIN':
      return {
        editScripts: true,
        createCampaigns: true,
        viewReports: true,
        aiInsights: true,
      }
    case 'MANAGER':
      return {
        editScripts: true,
        createCampaigns: true,
        viewReports: true,
        aiInsights: true,
      }
    case 'ANALYST':
      return {
        editScripts: false,
        createCampaigns: false,
        viewReports: true,
        aiInsights: true,
      }
    case 'AGENT':
    default:
      return {
        editScripts: false,
        createCampaigns: false,
        viewReports: false,
        aiInsights: false,
      }
  }
}

export function emptyActivity(): UserActivity {
  return {
    lastLoginAt: null,
    lastCallAt: null,
    sessionsToday: 0,
    lastActiveAt: null,
  }
}

function demoStatsForSeed(email: string): UserPerfStats {
  const e = email.toLowerCase()
  if (e === 'admin@demo.local') {
    return { callsHandled: 124, conversionPct: 26, avgAiScore: 86 }
  }
  if (e === 'agent@demo.local') {
    return { callsHandled: 842, conversionPct: 31, avgAiScore: 88 }
  }
  return {
    callsHandled: 40 + (email.length % 120),
    conversionPct: 16 + (email.length % 14),
    avgAiScore: 72 + (email.length % 22),
  }
}

function demoActivityForSeed(email: string, createdAt: string): UserActivity {
  const e = email.toLowerCase()
  if (e === 'admin@demo.local') {
    return {
      lastLoginAt: new Date().toISOString(),
      lastCallAt: new Date(Date.now() - 3600000).toISOString(),
      sessionsToday: 2,
      lastActiveAt: new Date().toISOString(),
    }
  }
  if (e === 'agent@demo.local') {
    return {
      lastLoginAt: new Date(Date.now() - 900000).toISOString(),
      lastCallAt: new Date(Date.now() - 120000).toISOString(),
      sessionsToday: 14,
      lastActiveAt: new Date(Date.now() - 60000).toISOString(),
    }
  }
  return {
    lastLoginAt: createdAt,
    lastCallAt: null,
    sessionsToday: 0,
    lastActiveAt: createdAt,
  }
}

export function getSeedUsers(): MockStoredUser[] {
  const now = new Date().toISOString()
  const admin: MockStoredUser = {
    id: 'u_seed_admin',
    email: 'admin@demo.local',
    name: 'Admin',
    role: 'ADMIN',
    password: 'demo1234',
    createdAt: now,
    status: 'active',
    permissions: defaultPermissions('ADMIN'),
    stats: demoStatsForSeed('admin@demo.local'),
    activity: demoActivityForSeed('admin@demo.local', now),
  }
  const agent: MockStoredUser = {
    id: 'u_seed_agent',
    email: 'agent@demo.local',
    name: 'Agent Smith',
    role: 'AGENT',
    password: 'demo1234',
    createdAt: now,
    status: 'active',
    permissions: defaultPermissions('AGENT'),
    stats: demoStatsForSeed('agent@demo.local'),
    activity: demoActivityForSeed('agent@demo.local', now),
  }
  return [admin, agent]
}

function parseRole(r: unknown): MockRole {
  if (r === 'ADMIN') return 'ADMIN'
  if (r === 'MANAGER') return 'MANAGER'
  if (r === 'ANALYST') return 'ANALYST'
  if (r === 'AGENT') return 'AGENT'
  if (r === 'USER') return 'AGENT'
  return 'AGENT'
}

function parseStatus(s: unknown): UserStatus {
  if (s === 'disabled' || s === 'offline' || s === 'active') return s
  return 'active'
}

function migrateRecord(raw: unknown): MockStoredUser {
  const r = raw as Partial<MockStoredUser> & { role?: string }
  const email = String(r.email ?? 'unknown@local')
  const createdAt = r.createdAt ?? new Date().toISOString()
  const role = parseRole(r.role)
  const permissions =
    r.permissions && typeof r.permissions === 'object'
      ? { ...defaultPermissions(role), ...r.permissions }
      : defaultPermissions(role)
  const stats =
    r.stats && typeof r.stats === 'object'
      ? {
          callsHandled: Number(r.stats.callsHandled) || demoStatsForSeed(email).callsHandled,
          conversionPct: Number(r.stats.conversionPct) || demoStatsForSeed(email).conversionPct,
          avgAiScore: Number(r.stats.avgAiScore) || demoStatsForSeed(email).avgAiScore,
        }
      : demoStatsForSeed(email)
  const activity =
    r.activity && typeof r.activity === 'object'
      ? {
          lastLoginAt: r.activity.lastLoginAt ?? null,
          lastCallAt: r.activity.lastCallAt ?? null,
          sessionsToday: Number(r.activity.sessionsToday) || 0,
          lastActiveAt: r.activity.lastActiveAt ?? null,
        }
      : demoActivityForSeed(email, createdAt)

  return {
    id: String(r.id ?? crypto.randomUUID()),
    email,
    name: String(r.name ?? 'User'),
    role,
    password: String(r.password ?? 'demo1234'),
    createdAt,
    status: parseStatus(r.status),
    permissions,
    stats,
    activity,
    invitePending: Boolean(r.invitePending),
  }
}

export function loadUsers(): MockStoredUser[] {
  try {
    const rawV2 = localStorage.getItem(KEY_USERS)
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as unknown[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((x) => migrateRecord(x))
      }
    }
    const rawV1 = localStorage.getItem(KEY_USERS_V1)
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as unknown[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const migrated = parsed.map((x) => migrateRecord(x))
        saveUsers(migrated)
        return migrated
      }
    }
  } catch {
    /* ignore */
  }
  const seeded = getSeedUsers()
  saveUsers(seeded)
  return seeded
}

export function saveUsers(users: MockStoredUser[]): void {
  localStorage.setItem(KEY_USERS, JSON.stringify(users))
}

export function getSessionUserId(): string | null {
  return localStorage.getItem('callpilot_demo_session_user_id_v1')
}

export function setSessionUserId(id: string | null): void {
  const KEY_SESSION = 'callpilot_demo_session_user_id_v1'
  if (id) localStorage.setItem(KEY_SESSION, id)
  else localStorage.removeItem(KEY_SESSION)
}

export function toPublic(u: MockStoredUser): MockPublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    status: u.status,
    permissions: u.permissions,
    stats: u.stats,
    activity: u.activity,
    invitePending: u.invitePending,
  }
}

export function findUserByEmail(
  users: MockStoredUser[],
  email: string,
): MockStoredUser | undefined {
  const e = email.trim().toLowerCase()
  return users.find((u) => u.email.toLowerCase() === e)
}

export function randomInviteStats(): UserPerfStats {
  return {
    callsHandled: 0,
    conversionPct: 0,
    avgAiScore: 0,
  }
}
