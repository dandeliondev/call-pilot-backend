import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Layout for /login and /invite/:token. If the user is already authenticated,
 * /login bounces to /dashboard so back-button doesn't strand them on the auth
 * screen. /invite/:token is allowed for any state (used by recipients before
 * they have a session).
 */
export function PublicLayout({ requireGuest = false }: { requireGuest?: boolean }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    )
  }

  if (requireGuest && status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
