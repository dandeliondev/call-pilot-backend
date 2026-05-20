import { createContext } from 'react'
import type {
  BulkActionResult,
  ImportResult,
  InvitePayload,
  InviteResponse,
  ManagedUser,
  UpdateUserPatch,
  UserListFilters,
  UserPermissions,
  UserRole,
  UserStatus,
} from '../lib/usersApi'

export interface UsersState {
  users: ManagedUser[]
  loaded: boolean
  refresh: (filters?: UserListFilters) => Promise<void>
  updateUser: (id: string, patch: UpdateUserPatch) => Promise<ManagedUser>
  updateRole: (id: string, role: UserRole) => Promise<ManagedUser>
  updateStatus: (id: string, status: UserStatus) => Promise<ManagedUser>
  updateName: (id: string, name: string) => Promise<ManagedUser>
  updatePermissions: (id: string, perms: UserPermissions) => Promise<ManagedUser>
  resetPassword: (id: string) => Promise<string>
  bulkSetRole: (ids: string[], role: UserRole) => Promise<BulkActionResult>
  bulkSetStatus: (ids: string[], status: UserStatus) => Promise<BulkActionResult>
  importCsv: (file: File) => Promise<ImportResult>
  inviteUser: (payload: InvitePayload) => Promise<InviteResponse>
}

export const UsersContext = createContext<UsersState | null>(null)
