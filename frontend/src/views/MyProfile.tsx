import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../lib/api'
import {
  changePassword,
  confirmPassword,
  confirmTwoFactor,
  disableTwoFactor,
  enableTwoFactor,
  fetchPreferences,
  fetchTwoFactorQrSvg,
  fetchTwoFactorRecoveryCodes,
  regenerateTwoFactorRecoveryCodes,
  updatePreferences,
  updateProfileInformation,
  type UserPreferences,
} from '../lib/profileApi'

type Tab = 'profile' | 'security' | 'notifications' | 'ui'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'ui', label: 'UI preferences' },
]

const PREF_DEFAULTS: UserPreferences = {
  emailDigest: true,
  smsAlerts: false,
  themePref: 'system',
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.body && typeof err.body === 'object' && 'errors' in err.body) {
      const errors = (err.body as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors)[0]?.[0]
      if (first) return first
    }
    return err.message
  }
  return err instanceof Error ? err.message : fallback
}

export function MyProfile() {
  const { user, refresh } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')

  // --- Profile fields ---
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user?.name, user?.email])

  // --- Password change ---
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // --- 2FA enrollment flow ---
  const [twoFaBusy, setTwoFaBusy] = useState(false)
  const [pwPromptOpen, setPwPromptOpen] = useState(false)
  const [pwPromptValue, setPwPromptValue] = useState('')
  type PendingAction = 'enable' | 'disable' | 'regenerate' | null
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  // --- Preferences ---
  const [prefs, setPrefs] = useState<UserPreferences>(PREF_DEFAULTS)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPreferences()
      .then((p) => {
        if (!cancelled) {
          setPrefs(p)
          setPrefsLoaded(true)
        }
      })
      .catch(() => setPrefsLoaded(true))
    return () => {
      cancelled = true
    }
  }, [])

  const patchPrefs = useCallback(async (patch: Partial<UserPreferences>) => {
    const optimistic = { ...prefs, ...patch }
    setPrefs(optimistic)
    try {
      const next = await updatePreferences(patch)
      setPrefs(next)
    } catch (err) {
      setPrefs(prefs)
      toast.error(errorMessage(err, 'Could not save preference'))
    }
  }, [prefs])

  const onSaveProfile = useCallback(async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setSavingProfile(true)
    try {
      await updateProfileInformation({ name: name.trim(), email: email.trim() })
      await refresh()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save profile'))
    } finally {
      setSavingProfile(false)
    }
  }, [name, email, refresh])

  const onChangePassword = useCallback(async () => {
    if (!currentPw || !newPw) {
      toast.error('Fill all password fields')
      return
    }
    if (newPw !== newPwConfirm) {
      toast.error('New passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword({
        current_password: currentPw,
        password: newPw,
        password_confirmation: newPwConfirm,
      })
      setCurrentPw('')
      setNewPw('')
      setNewPwConfirm('')
      toast.success('Password changed')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change password'))
    } finally {
      setSavingPassword(false)
    }
  }, [currentPw, newPw, newPwConfirm])

  const openPwPromptFor = useCallback((action: Exclude<PendingAction, null>) => {
    setPendingAction(action)
    setPwPromptValue('')
    setPwPromptOpen(true)
  }, [])

  const runPendingAction = useCallback(async () => {
    if (!pendingAction || !pwPromptValue) return
    setTwoFaBusy(true)
    try {
      await confirmPassword(pwPromptValue)
      setPwPromptOpen(false)
      setPwPromptValue('')

      if (pendingAction === 'enable') {
        await enableTwoFactor()
        const svg = await fetchTwoFactorQrSvg()
        setQrSvg(svg)
        // user must scan and submit the code; recovery codes shown after confirmation
      } else if (pendingAction === 'disable') {
        await disableTwoFactor()
        setQrSvg(null)
        setRecoveryCodes(null)
        await refresh()
        toast.success('Two-factor authentication disabled')
      } else if (pendingAction === 'regenerate') {
        await regenerateTwoFactorRecoveryCodes()
        const codes = await fetchTwoFactorRecoveryCodes()
        setRecoveryCodes(codes)
        toast.success('New recovery codes generated')
      }
      setPendingAction(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Action failed'))
    } finally {
      setTwoFaBusy(false)
    }
  }, [pendingAction, pwPromptValue, refresh])

  const onConfirmTwoFactor = useCallback(async () => {
    if (!otpCode.trim()) {
      toast.error('Enter the 6-digit code from your authenticator app')
      return
    }
    setTwoFaBusy(true)
    try {
      await confirmTwoFactor(otpCode.trim())
      const codes = await fetchTwoFactorRecoveryCodes()
      setRecoveryCodes(codes)
      setQrSvg(null)
      setOtpCode('')
      await refresh()
      toast.success('Two-factor authentication enabled')
    } catch (err) {
      toast.error(errorMessage(err, 'Invalid code'))
    } finally {
      setTwoFaBusy(false)
    }
  }, [otpCode, refresh])

  const twoFactorEnabled = useMemo(() => user?.twoFactorEnabled ?? false, [user?.twoFactorEnabled])

  if (!user) {
    return <Card title="Loading…">One moment.</Card>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text">My profile</h2>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
              tab === id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card title="Profile information" description="Your display name and contact email.">
          <div className="grid gap-4 max-w-lg text-sm">
            <label className="block">
              <span className="text-muted">Name</span>
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-muted">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => void onSaveProfile()}
              disabled={savingProfile}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </Card>
      )}

      {tab === 'security' && (
        <div className="space-y-6">
          <Card title="Change password">
            <div className="grid gap-4 max-w-lg text-sm">
              <label className="block">
                <span className="text-muted">Current password</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
              <label className="block">
                <span className="text-muted">New password</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="text-muted">Confirm new password</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                  value={newPwConfirm}
                  onChange={(e) => setNewPwConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <button
                type="button"
                onClick={() => void onChangePassword()}
                disabled={savingPassword}
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
              >
                {savingPassword ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </Card>

          <Card
            title="Two-factor authentication"
            description={
              twoFactorEnabled
                ? 'Two-factor auth is enabled on your account.'
                : 'Add a TOTP authenticator (e.g. 1Password, Google Authenticator) for an extra factor at login.'
            }
          >
            {!twoFactorEnabled && !qrSvg && !recoveryCodes && (
              <button
                type="button"
                onClick={() => openPwPromptFor('enable')}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Enable 2FA
              </button>
            )}

            {qrSvg && (
              <div className="space-y-4 max-w-md">
                <p className="text-sm text-muted">
                  Scan this QR code with your authenticator, then enter the generated code below.
                </p>
                <div
                  className="inline-block rounded-lg border border-border bg-white p-3"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <label className="block text-sm">
                  <span className="text-muted">Authenticator code</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 tracking-widest"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void onConfirmTwoFactor()}
                  disabled={twoFaBusy}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                >
                  {twoFaBusy ? 'Confirming…' : 'Confirm and enable'}
                </button>
              </div>
            )}

            {recoveryCodes && (
              <div className="mt-4 space-y-2 max-w-md">
                <p className="text-sm font-medium text-text">Recovery codes</p>
                <p className="text-xs text-muted">
                  Save these somewhere safe — each code lets you log in once if you lose your device.
                  They are shown only this time.
                </p>
                <ul className="rounded-lg border border-amber-200 bg-amber-50 p-3 font-mono text-xs">
                  {recoveryCodes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setRecoveryCodes(null)}
                  className="text-xs text-muted underline-offset-2 hover:underline"
                >
                  I've saved them
                </button>
              </div>
            )}

            {twoFactorEnabled && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPwPromptFor('regenerate')}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  Regenerate recovery codes
                </button>
                <button
                  type="button"
                  onClick={() => openPwPromptFor('disable')}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100"
                >
                  Disable 2FA
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'notifications' && (
        <Card title="Notifications">
          {!prefsLoaded ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <div className="space-y-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefs.emailDigest}
                  onChange={(e) => void patchPrefs({ emailDigest: e.target.checked })}
                />
                Daily performance digest by email
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefs.smsAlerts}
                  onChange={(e) => void patchPrefs({ smsAlerts: e.target.checked })}
                />
                SMS alerts for QA flags
              </label>
            </div>
          )}
        </Card>
      )}

      {tab === 'ui' && (
        <Card title="UI preferences">
          <label className="block max-w-md text-sm">
            <span className="text-muted">Theme</span>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={prefs.themePref}
              onChange={(e) =>
                void patchPrefs({ themePref: e.target.value as UserPreferences['themePref'] })
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <p className="mt-2 text-xs text-muted">
            (Theme switching is wired to the API; the visual switch is wired in a future pass.)
          </p>
        </Card>
      )}

      <Modal
        open={pwPromptOpen}
        onClose={() => {
          setPwPromptOpen(false)
          setPendingAction(null)
        }}
        title="Confirm your password"
        size="sm"
      >
        <div className="space-y-4 text-sm">
          <p className="text-muted">For your security, re-enter your password to continue.</p>
          <input
            type="password"
            className="w-full rounded-lg border border-border px-3 py-2"
            value={pwPromptValue}
            onChange={(e) => setPwPromptValue(e.target.value)}
            autoComplete="current-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => void runPendingAction()}
            disabled={twoFaBusy || !pwPromptValue}
            className="w-full rounded-xl bg-primary py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {twoFaBusy ? 'Working…' : 'Confirm'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
