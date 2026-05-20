import { useContext } from 'react'
import { UsersContext, type UsersState } from '../context/users-context'

export function useUsers(): UsersState {
  const ctx = useContext(UsersContext)
  if (!ctx) {
    throw new Error('useUsers must be used inside <UsersProvider>')
  }
  return ctx
}
