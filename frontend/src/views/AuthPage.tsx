import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        toast.success('Signed in')
        navigate(from, { replace: true })
      } else {
        if (password.length < 8) {
          toast.error('Password must be at least 8 characters')
          return
        }
        await register(name, email, password)
        toast.success('Account created — check your email to verify')
        navigate(from, { replace: true })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
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
          <h1 className="text-xl font-semibold text-text">ProSpeaking Portal</h1>
          <p className="text-sm text-muted">Sign in to continue</p>
        </div>
        <Card>
          <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-text shadow-sm'
                  : 'text-muted'
              }`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-white text-text shadow-sm'
                  : 'text-muted'
              }`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                minLength={mode === 'register' ? 8 : undefined}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </Card>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-950">
          Dev admin: <strong>admin@prospeaking.test</strong> / <strong>password</strong>
        </p>
      </div>
    </div>
  )
}
