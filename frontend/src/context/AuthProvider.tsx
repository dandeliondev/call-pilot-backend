import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, apiFetch } from '../lib/api'
import {
  AuthContext,
  type AuthRole,
  type AuthStatus,
  type AuthUser,
} from './auth-context'

interface LaravelRole {
  name: string
}

interface LaravelUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  two_factor_confirmed_at: string | null
  roles?: LaravelRole[]
}

const KNOWN_ROLES: AuthRole[] = ['ADMIN', 'MANAGER', 'AGENT', 'ANALYST']

function normalizeUser(u: LaravelUser): AuthUser {
  const roleNames = (u.roles ?? []).map((r) => r.name)
  const upper = roleNames.map((n) => n.toUpperCase())
  const role = (KNOWN_ROLES.find((r) => upper.includes(r)) ?? 'AGENT') as AuthRole
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    roles: roleNames,
    emailVerifiedAt: u.email_verified_at,
    twoFactorEnabled: u.two_factor_confirmed_at !== null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<LaravelUser>('/api/user')
      setUser(normalizeUser(data))
      setStatus('authenticated')
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 419)) {
        setUser(null)
        setStatus('guest')
        return
      }
      throw err
    }
  }, [])

  useEffect(() => {
    refresh().catch(() => {
      setUser(null)
      setStatus('guest')
    })
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<{ two_factor?: boolean }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (result?.two_factor) {
        throw new Error('Two-factor authentication is required for this account.')
      }
      await refresh()
    },
    [refresh],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: password,
        }),
      })
      await refresh()
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    try {
      await apiFetch('/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setStatus('guest')
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
