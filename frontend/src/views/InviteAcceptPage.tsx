import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { ApiError, apiFetch } from '../lib/api'

/**
 * Landing page for the emailed invitation link. Accepts a fresh password and
 * confirmation, posts to /api/invitations/accept, and on success drops the
 * user at /login (the SPA's auth landing). Errors from the API surface in
 * the toast — most commonly an expired or already-used token.
 */
export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      toast.error('Missing invitation token')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setBusy(true)
    try {
      await apiFetch('/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password,
          password_confirmation: confirm,
        }),
      })
      toast.success('Invitation accepted — sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      const fallback = 'Could not accept invitation'
      if (err instanceof ApiError && err.body && typeof err.body === 'object' && 'errors' in err.body) {
        const errors = (err.body as { errors: Record<string, string[]> }).errors
        const first = Object.values(errors)[0]?.[0]
        toast.error(first ?? err.message ?? fallback)
      } else if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(fallback)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            PC
          </div>
          <h1 className="text-xl font-semibold text-text">Accept invitation</h1>
          <p className="text-sm text-muted">Choose a password to activate your account.</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">New password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm password</label>
              <input
                required
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {busy ? 'Activating…' : 'Activate account'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
