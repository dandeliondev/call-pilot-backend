import { createContext } from 'react'
import type {
  MockPublicUser,
  MockRole,
  UserPermissions,
  UserStatus,
} from '../mock/usersStore'

export interface InviteUserInput {
  name: string
  email: string
  role: MockRole
  sendInvite: boolean
}

export interface MockAuthState {
  user: MockPublicUser | null
  directory: MockPublicUser[]
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUserRole: (userId: string, role: MockRole) => void
  updateUserPermissions: (userId: string, patch: Partial<UserPermissions>) => void
  setUserStatus: (userId: string, status: UserStatus) => void
  inviteUser: (input: InviteUserInput) => void
  updateUserName: (userId: string, name: string) => void
  resetUserPassword: (userId: string) => void
  bulkSetRole: (userIds: string[], role: MockRole) => void
  bulkSetStatus: (userIds: string[], status: UserStatus) => void
  importUsersFromCsv: (csvText: string) => number
  resetDemoData: () => void
}

export const MockAuthContext = createContext<MockAuthState | null>(null)
