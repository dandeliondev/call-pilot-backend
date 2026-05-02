import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  findUserByEmail,
  getSessionUserId,
  loadUsers,
  saveUsers,
  setSessionUserId,
  getSeedUsers,
  toPublic,
  type MockPublicUser,
  type MockRole,
  type MockStoredUser,
} from '../mock/usersStore'
import { MockAuthContext } from './mock-auth-context'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function initialSessionId(): string | null {
  const list = loadUsers()
  const id = getSessionUserId()
  if (!id) return null
  if (!list.some((u) => u.id === id)) {
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
    setSessionUserId(found.id)
    setSessionIdState(found.id)
    setUsers(loadUsers())
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await delay(500)
      const list = loadUsers()
      if (findUserByEmail(list, email)) {
        throw new Error('Email already registered')
      }
      const next: MockStoredUser = {
        id: crypto.randomUUID(),
        email: email.trim(),
        name: name.trim(),
        role: 'USER',
        password,
        createdAt: new Date().toISOString(),
      }
      list.push(next)
      saveUsers(list)
      setUsers(list)
      setSessionUserId(next.id)
      setSessionIdState(next.id)
    },
    [],
  )

  const logout = useCallback(() => {
    setSessionUserId(null)
    setSessionIdState(null)
  }, [])

  const updateUserRole = useCallback(
    (userId: string, role: MockRole) => {
      const list = loadUsers()
      const me = sessionId
      const target = list.find((u) => u.id === userId)
      if (!target) return

      const adminCount = list.filter((u) => u.role === 'ADMIN').length
      if (target.role === 'ADMIN' && role === 'USER' && adminCount <= 1) {
        toast.error('Keep at least one admin in this demo.')
        return
      }
      if (userId === me && target.role === 'ADMIN' && role === 'USER') {
        toast.error('You cannot remove your own admin role in this demo.')
        return
      }

      const next = list.map((u) =>
        u.id === userId ? { ...u, role } : u,
      )
      saveUsers(next)
      setUsers(next)
      toast.success('Role updated (demo)')
    },
    [sessionId],
  )

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

  const directory = useMemo(
    () => users.map(toPublic),
    [users],
  )

  const value = useMemo(
    () => ({
      user,
      directory,
      login,
      register,
      logout,
      updateUserRole,
      resetDemoData,
    }),
    [
      user,
      directory,
      login,
      register,
      logout,
      updateUserRole,
      resetDemoData,
    ],
  )

  return (
    <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
  )
}
