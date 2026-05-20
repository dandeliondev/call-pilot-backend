import { apiFetch } from './api'

/**
 * `openaiApiKey` is the **display value** returned by the API — a masked
 * preview like `sk-…cdef`, or null when unset. Real plaintext never lives
 * on the client; to update, send a fresh full value via `updateSettings`.
 */
export interface AppSettings {
  app_name: string
  default_timezone: string
  default_pacing_seconds: number
  default_daily_call_limit: number
  default_campaign_type: 'outbound' | 'inbound'
  openai_api_key: string | null
}

interface DataEnvelope<T> {
  data: T
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await apiFetch<DataEnvelope<AppSettings>>('/api/settings')
  return res.data
}

/**
 * Patch only the keys you pass. Omit `openai_api_key` (or send empty/null) to
 * leave the stored secret untouched — the server treats blank as no-op.
 */
export async function updateSettings(
  patch: Partial<{
    app_name: string
    default_timezone: string
    default_pacing_seconds: number
    default_daily_call_limit: number
    default_campaign_type: 'outbound' | 'inbound'
    openai_api_key: string
  }>,
): Promise<AppSettings> {
  const res = await apiFetch<DataEnvelope<AppSettings>>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return res.data
}
