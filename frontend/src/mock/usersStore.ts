/**
 * Demo-only user store (localStorage). Passwords are stored in plain text for this UI mock — not for production.
 */
export type MockRole = 'USER' | 'ADMIN'

export interface MockStoredUser {
  id: string
  email: string
  name: string
  role: MockRole
  /** Demo mock only — never do this in a real app */
  password: string
  createdAt: string
}

export type MockPublicUser = Omit<MockStoredUser, 'password'>

const KEY_USERS = 'callpilot_demo_users_v1'
const KEY_SESSION = 'callpilot_demo_session_user_id_v1'

export function getSeedUsers(): MockStoredUser[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'u_seed_admin',
      email: 'admin@demo.local',
      name: 'Admin',
      role: 'ADMIN',
      password: 'demo1234',
      createdAt: now,
    },
    {
      id: 'u_seed_agent',
      email: 'agent@demo.local',
      name: 'Agent Smith',
      role: 'USER',
      password: 'demo1234',
      createdAt: now,
    },
  ]
}

export function loadUsers(): MockStoredUser[] {
  try {
    const raw = localStorage.getItem(KEY_USERS)
    if (raw) {
      const parsed = JSON.parse(raw) as MockStoredUser[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
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
  return localStorage.getItem(KEY_SESSION)
}

export function setSessionUserId(id: string | null): void {
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
  }
}

export function findUserByEmail(
  users: MockStoredUser[],
  email: string,
): MockStoredUser | undefined {
  const e = email.trim().toLowerCase()
  return users.find((u) => u.email.toLowerCase() === e)
}
