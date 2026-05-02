import { useContext } from 'react'
import {
  MockAuthContext,
  type MockAuthState,
} from '../context/mock-auth-context'

export function useMockAuth(): MockAuthState {
  const ctx = useContext(MockAuthContext)
  if (!ctx) throw new Error('useMockAuth requires MockAuthProvider')
  return ctx
}
