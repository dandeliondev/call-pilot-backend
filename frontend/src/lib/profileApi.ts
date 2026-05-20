import { apiFetch } from './api'

export interface ProfileInformation {
  name: string
  email: string
}

/**
 * Self-service profile fields owned by Fortify's UpdateUserProfileInformation action.
 */
export async function updateProfileInformation(p: ProfileInformation): Promise<void> {
  await apiFetch('/user/profile-information', {
    method: 'PUT',
    body: JSON.stringify(p),
  })
}

export interface PasswordChange {
  current_password: string
  password: string
  password_confirmation: string
}

export async function changePassword(p: PasswordChange): Promise<void> {
  await apiFetch('/user/password', {
    method: 'PUT',
    body: JSON.stringify(p),
  })
}

/**
 * Confirms the user's password for the current session. Required by Fortify
 * before any sensitive mutation (enabling/disabling 2FA, regenerating recovery
 * codes) when `confirmPassword` is true in `config/fortify.php`.
 */
export async function confirmPassword(password: string): Promise<void> {
  await apiFetch('/user/confirm-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export async function enableTwoFactor(): Promise<void> {
  await apiFetch('/user/two-factor-authentication', { method: 'POST' })
}

export async function disableTwoFactor(): Promise<void> {
  await apiFetch('/user/two-factor-authentication', { method: 'DELETE' })
}

/**
 * Fortify returns `{svg: "<svg ...>"}` as JSON when Accept: application/json.
 */
export async function fetchTwoFactorQrSvg(): Promise<string> {
  const res = await apiFetch<{ svg: string }>('/user/two-factor-qr-code')
  return res.svg
}

export async function fetchTwoFactorRecoveryCodes(): Promise<string[]> {
  return apiFetch<string[]>('/user/two-factor-recovery-codes')
}

export async function regenerateTwoFactorRecoveryCodes(): Promise<void> {
  await apiFetch('/user/two-factor-recovery-codes', { method: 'POST' })
}

export async function confirmTwoFactor(code: string): Promise<void> {
  await apiFetch('/user/confirmed-two-factor-authentication', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

// --- Preferences ---

export interface UserPreferences {
  emailDigest: boolean
  smsAlerts: boolean
  themePref: 'system' | 'light' | 'dark'
}

interface PreferencesEnvelope {
  data: UserPreferences
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const res = await apiFetch<PreferencesEnvelope>('/api/me/preferences')
  return res.data
}

export async function updatePreferences(
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const res = await apiFetch<PreferencesEnvelope>('/api/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return res.data
}
