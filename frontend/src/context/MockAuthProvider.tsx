import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  defaultPermissions,
  emptyActivity,
  findUserByEmail,
  getSeedUsers,
  getSessionUserId,
  loadUsers,
  randomInviteStats,
  saveUsers,
  setSessionUserId,
  toPublic,
  type MockPublicUser,
  type MockRole,
  type MockStoredUser,
  type UserPermissions,
  type UserStatus,
} from '../mock/usersStore'
import { MockAuthContext, type InviteUserInput } from './mock-auth-context'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function initialSessionId(): string | null {
  const list = loadUsers()
  const id = getSessionUserId()
  if (!id) return null
  if (!list.some((u) => u.id === id)) {
    setSessionUserId(null)
    return null
  }
  const u = list.find((x) => x.id === id)
  if (u?.status === 'disabled') {
    setSessionUserId(null)
    return null
  }
  return id
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<MockStoredUser[]>(() => loadUsers())
  const [sessionId, setSessionIdState] = useState<string | null>(initialSessionId)

  const user: MockPublicUser | null = useMemo(() => {
    if (!sessionId) return null
    const u = users.find((x) => x.id === sessionId)
    return u ? toPublic(u) : null
  }, [sessionId, users])

  const login = useCallback(async (email: string, password: string) => {
    await delay(400)
    const list = loadUsers()
    const found = findUserByEmail(list, email)
    if (!found || found.password !== password) {
      throw new Error('Invalid email or password')
    }
    if (found.status === 'disabled') {
      throw new Error('This account has been disabled')
    }
    const now = new Date().toISOString()
    const next = list.map((u) =>
      u.id === found.id
        ? {
            ...u,
            activity: {
              ...u.activity,
              lastLoginAt: now,
              lastActiveAt: now,
              sessionsToday: u.activity.sessionsToday + 1,
            },
          }
        : u,
    )
    saveUsers(next)
    setUsers(next)
    setSessionUserId(found.id)
    setSessionIdState(found.id)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await delay(500)
      const list = loadUsers()
      if (findUserByEmail(list, email)) {
        throw new Error('Email already registered')
      }
      const createdAt = new Date().toISOString()
      const nextUser: MockStoredUser = {
        id: crypto.randomUUID(),
        email: email.trim(),
        name: name.trim(),
        role: 'AGENT',
        password,
        createdAt,
        status: 'active',
        permissions: defaultPermissions('AGENT'),
        stats: randomInviteStats(),
        activity: emptyActivity(),
      }
      list.push(nextUser)
      saveUsers(list)
      setUsers(list)
      setSessionUserId(nextUser.id)
      setSessionIdState(nextUser.id)
    },
    [],
  )

  const logout = useCallback(() => {
    setSessionUserId(null)
    setSessionIdState(null)
  }, [])

  const adminCount = (list: MockStoredUser[]) =>
    list.filter((u) => u.role === 'ADMIN').length

  const updateUserRole = useCallback(
    (userId: string, role: MockRole) => {
      const list = loadUsers()
      const me = sessionId
      const target = list.find((u) => u.id === userId)
      if (!target) return

      const admins = adminCount(list)
      if (target.role === 'ADMIN' && role !== 'ADMIN' && admins <= 1) {
        toast.error('Keep at least one admin in this demo.')
        return
      }
      if (userId === me && target.role === 'ADMIN' && role !== 'ADMIN') {
        toast.error('You cannot remove your own admin role in this demo.')
        return
      }

      const next = list.map((u) =>
        u.id === userId
          ? { ...u, role, permissions: defaultPermissions(role) }
          : u,
      )
      saveUsers(next)
      setUsers(next)
      toast.success('Role updated')
    },
    [sessionId],
  )

  const updateUserPermissions = useCallback(
    (userId: string, patch: Partial<UserPermissions>) => {
      const list = loadUsers()
      const next = list.map((u) =>
        u.id === userId
          ? { ...u, permissions: { ...u.permissions, ...patch } }
          : u,
      )
      saveUsers(next)
      setUsers(next)
      toast.success('Permissions saved')
    },
    [],
  )

  const setUserStatus = useCallback((userId: string, status: UserStatus) => {
    const list = loadUsers()
    const me = sessionId
    const target = list.find((u) => u.id === userId)
    if (!target) return
    if (target.role === 'ADMIN' && status === 'disabled') {
      const others = list.filter((u) => u.role === 'ADMIN' && u.id !== userId)
      if (others.length === 0) {
        toast.error('Cannot disable the only admin.')
        return
      }
    }
    if (userId === me && status === 'disabled') {
      toast.error('Disable another account in this demo — not yourself.')
      return
    }
    const next = list.map((u) => (u.id === userId ? { ...u, status } : u))
    saveUsers(next)
    setUsers(next)
    toast.success(
      status === 'disabled' ? 'User disabled' : status === 'active' ? 'User enabled' : 'Status updated',
    )
  }, [sessionId])

  const inviteUser = useCallback((input: InviteUserInput) => {
    const list = loadUsers()
    const email = input.email.trim()
    if (findUserByEmail(list, email)) {
      toast.error('That email is already in the directory.')
      return
    }
    const createdAt = new Date().toISOString()
    const u: MockStoredUser = {
      id: crypto.randomUUID(),
      email,
      name: input.name.trim(),
      role: input.role,
      password: 'InviteTemp1!',
      createdAt,
      status: 'offline',
      permissions: defaultPermissions(input.role),
      stats: randomInviteStats(),
      activity: emptyActivity(),
      invitePending: input.sendInvite,
    }
    list.push(u)
    saveUsers(list)
    setUsers(list)
    if (input.sendInvite) {
      toast.success(`Invite recorded — link: ${window.location.origin}/invite/demo-token`)
    } else {
      toast.success(`User added — temp password: InviteTemp1!`)
    }
  }, [])

  const updateUserName = useCallback((userId: string, name: string) => {
    const list = loadUsers()
    const next = list.map((u) => (u.id === userId ? { ...u, name: name.trim() } : u))
    saveUsers(next)
    setUsers(next)
    toast.success('Name updated')
  }, [])

  const resetUserPassword = useCallback((userId: string) => {
    const list = loadUsers()
    const next = list.map((u) =>
      u.id === userId ? { ...u, password: 'ResetTemp1!' } : u,
    )
    saveUsers(next)
    setUsers(next)
    toast.success('Password reset to ResetTemp1! (demo)')
  }, [])

  const bulkSetRole = useCallback(
    (userIds: string[], role: MockRole) => {
      if (userIds.length === 0) return
      let working = loadUsers()
      const me = sessionId
      for (const id of userIds) {
        working = working.map((u) => {
          if (u.id !== id) return u
          if (u.id === me && u.role === 'ADMIN' && role !== 'ADMIN') return u
          if (u.role === 'ADMIN' && role !== 'ADMIN' && adminCount(working) <= 1) {
            return u
          }
          return { ...u, role, permissions: defaultPermissions(role) }
        })
      }
      saveUsers(working)
      setUsers(working)
      toast.success(`Updated role for selection`)
    },
    [sessionId],
  )

  const bulkSetStatus = useCallback(
    (userIds: string[], status: UserStatus) => {
      if (userIds.length === 0) return
      const list = loadUsers()
      const me = sessionId
      const next = list.map((u) => {
        if (!userIds.includes(u.id)) return u
        if (u.role === 'ADMIN' && status === 'disabled') {
          const admins = list.filter((x) => x.role === 'ADMIN')
          if (admins.length <= 1) return u
        }
        if (u.id === me && status === 'disabled') return u
        return { ...u, status }
      })
      saveUsers(next)
      setUsers(next)
      toast.success(`Updated status for selection`)
    },
    [sessionId],
  )

  const importUsersFromCsv = useCallback((csvText: string): number => {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return 0
    const list = loadUsers()
    let added = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(',').map((c) => c.replace(/^"|"$/g, '').trim())
      const [name, email, roleRaw] = cols
      if (!email || !name) continue
      if (findUserByEmail(list, email)) continue
      const roleMap: Record<string, MockRole> = {
        admin: 'ADMIN',
        manager: 'MANAGER',
        agent: 'AGENT',
        analyst: 'ANALYST',
      }
      const role =
        roleMap[(roleRaw ?? 'agent').toLowerCase()] ?? 'AGENT'
      list.push({
        id: crypto.randomUUID(),
        email,
        name,
        role,
        password: 'ImportTemp1!',
        createdAt: new Date().toISOString(),
        status: 'offline',
        permissions: defaultPermissions(role),
        stats: randomInviteStats(),
        activity: emptyActivity(),
      })
      added += 1
    }
    saveUsers(list)
    setUsers(list)
    return added
  }, [])

  const resetDemoData = useCallback(() => {
    const seeded = getSeedUsers()
    saveUsers(seeded)
    setUsers(seeded)
    const sid = getSessionUserId()
    if (sid && !seeded.some((u) => u.id === sid)) {
      setSessionUserId(null)
      setSessionIdState(null)
    }
    toast.message('Demo users reset to defaults')
  }, [])

  const directory = useMemo(() => users.map(toPublic), [users])

  const value = useMemo(
    () => ({
      user,
      directory,
      login,
      register,
      logout,
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
    }),
    [
      user,
      directory,
      login,
      register,
      logout,
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
    ],
  )

  return (
    <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
  )
}
