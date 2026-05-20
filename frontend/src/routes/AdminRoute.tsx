import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Admin gate that sits inside ProtectedRoute. Non-admins are redirected to
 * /dashboard rather than 403 — keeping the SPA UX consistent with the prior
 * inline `if (!isAdmin) return <Dashboard />` behavior.
 */
export function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
