import { createContext } from 'react'

export type AuthRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'ANALYST'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: AuthRole
  roles: string[]
  emailVerifiedAt: string | null
  twoFactorEnabled: boolean
}

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

export interface AuthState {
  user: AuthUser | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
