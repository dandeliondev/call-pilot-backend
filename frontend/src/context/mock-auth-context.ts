import { createContext } from 'react'
import type { MockPublicUser, MockRole } from '../mock/usersStore'

export interface MockAuthState {
  user: MockPublicUser | null
  /** All users (admin UI); passwords never exposed */
  directory: MockPublicUser[]
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUserRole: (userId: string, role: MockRole) => void
  resetDemoData: () => void
}

export const MockAuthContext = createContext<MockAuthState | null>(null)
