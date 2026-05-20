import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  bulkUserAction,
  fetchUsers,
  importUsers,
  inviteUserApi,
  resetUserPassword,
  updateUser as updateUserApi,
  type InvitePayload,
  type ManagedUser,
  type UpdateUserPatch,
  type UserListFilters,
  type UserPermissions,
  type UserRole,
  type UserStatus,
} from '../lib/usersApi'
import { UsersContext } from './users-context'

export function UsersProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async (filters: UserListFilters = {}) => {
    const list = await fetchUsers(filters)
    setUsers(list)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== 'ADMIN') {
      setUsers([])
      setLoaded(false)
      return
    }
    void refresh()
  }, [status, user?.role, refresh])

  const mergeUser = useCallback((updated: ManagedUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }, [])

  const updateUser = useCallback(
    async (id: string, patch: UpdateUserPatch) => {
      const updated = await updateUserApi(id, patch)
      mergeUser(updated)
      return updated
    },
    [mergeUser],
  )

  const updateRole = useCallback(
    (id: string, role: UserRole) => updateUser(id, { role }),
    [updateUser],
  )

  const updateStatus = useCallback(
    (id: string, status: UserStatus) => updateUser(id, { status }),
    [updateUser],
  )

  const updateName = useCallback(
    (id: string, name: string) => updateUser(id, { name }),
    [updateUser],
  )

  const updatePermissions = useCallback(
    (id: string, permissions: UserPermissions) => updateUser(id, { permissions }),
    [updateUser],
  )

  const resetPassword = useCallback(async (id: string) => {
    const { tempPassword } = await resetUserPassword(id)
    return tempPassword
  }, [])

  const bulkSetRole = useCallback(
    async (ids: string[], role: UserRole) => {
      const result = await bulkUserAction({ ids, action: 'set_role', value: role })
      await refresh()
      return result
    },
    [refresh],
  )

  const bulkSetStatus = useCallback(
    async (ids: string[], status: UserStatus) => {
      const result = await bulkUserAction({ ids, action: 'set_status', value: status })
      await refresh()
      return result
    },
    [refresh],
  )

  const importCsv = useCallback(
    async (file: File) => {
      const result = await importUsers(file)
      await refresh()
      return result
    },
    [refresh],
  )

  const inviteUser = useCallback(
    async (payload: InvitePayload) => {
      const response = await inviteUserApi(payload)
      setUsers((prev) => [response.user, ...prev])
      return response
    },
    [],
  )

  const value = useMemo(
    () => ({
      users,
      loaded,
      refresh,
      updateUser,
      updateRole,
      updateStatus,
      updateName,
      updatePermissions,
      resetPassword,
      bulkSetRole,
      bulkSetStatus,
      importCsv,
      inviteUser,
    }),
    [
      users,
      loaded,
      refresh,
      updateUser,
      updateRole,
      updateStatus,
      updateName,
      updatePermissions,
      resetPassword,
      bulkSetRole,
      bulkSetStatus,
      importCsv,
      inviteUser,
    ],
  )

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}
