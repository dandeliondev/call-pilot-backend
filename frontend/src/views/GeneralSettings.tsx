import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { ApiError } from '../lib/api'
import {
  fetchSettings,
  updateSettings,
  type AppSettings,
} from '../lib/settingsApi'

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

export function GeneralSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Editable drafts (the API never round-trips the real OpenAI key).
  const [appName, setAppName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [pacing, setPacing] = useState(5)
  const [dailyLimit, setDailyLimit] = useState(200)
  const [campaignType, setCampaignType] = useState<'outbound' | 'inbound'>('outbound')
  const [openAiInput, setOpenAiInput] = useState('')

  const [savingBranding, setSavingBranding] = useState(false)
  const [savingDialer, setSavingDialer] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchSettings()
      .then((s) => {
        if (cancelled) return
        setSettings(s)
        setAppName(s.app_name)
        setTimezone(s.default_timezone)
        setPacing(s.default_pacing_seconds)
        setDailyLimit(s.default_daily_call_limit)
        setCampaignType(s.default_campaign_type)
      })
      .catch((err) => toast.error(errorMessage(err, 'Could not load settings')))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onSaveBranding = useCallback(async () => {
    setSavingBranding(true)
    try {
      const next = await updateSettings({
        app_name: appName.trim(),
        default_timezone: timezone.trim(),
      })
      setSettings(next)
      toast.success('Branding saved')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save branding'))
    } finally {
      setSavingBranding(false)
    }
  }, [appName, timezone])

  const onSaveDialer = useCallback(async () => {
    setSavingDialer(true)
    try {
      const next = await updateSettings({
        default_pacing_seconds: pacing,
        default_daily_call_limit: dailyLimit,
        default_campaign_type: campaignType,
      })
      setSettings(next)
      toast.success('Dialer defaults saved')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save dialer defaults'))
    } finally {
      setSavingDialer(false)
    }
  }, [pacing, dailyLimit, campaignType])

  const onSaveOpenAiKey = useCallback(async () => {
    const trimmed = openAiInput.trim()
    if (!trimmed) {
      toast.error('Enter a key first')
      return
    }
    setSavingKey(true)
    try {
      const next = await updateSettings({ openai_api_key: trimmed })
      setSettings(next)
      setOpenAiInput('')
      toast.success('OpenAI key verified and saved')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save OpenAI key'))
    } finally {
      setSavingKey(false)
    }
  }, [openAiInput])

  if (loading) {
    return <Card title="Loading…">One moment.</Card>
  }

  if (!settings) {
    return <Card title="Settings unavailable">Could not load settings.</Card>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text">General settings</h2>
        <p className="text-sm text-muted">
          Application-wide defaults and integration credentials. Admin-only.
        </p>
      </div>

      <Card title="Branding" description="Display name and default timezone for new campaigns.">
        <div className="grid gap-4 max-w-lg text-sm">
          <label className="block">
            <span className="text-muted">App name</span>
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-muted">Default timezone</span>
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. UTC, America/Los_Angeles, Asia/Manila"
            />
          </label>
          <button
            type="button"
            onClick={() => void onSaveBranding()}
            disabled={savingBranding}
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {savingBranding ? 'Saving…' : 'Save branding'}
          </button>
        </div>
      </Card>

      <Card
        title="Dialer defaults"
        description="Initial values used by the Campaign Wizard. Per-campaign overrides still apply."
      >
        <div className="grid gap-4 max-w-lg text-sm sm:grid-cols-2">
          <label className="block">
            <span className="text-muted">Pacing (seconds between calls)</span>
            <input
              type="number"
              min={0}
              max={3600}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={pacing}
              onChange={(e) => setPacing(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="text-muted">Daily call limit</span>
            <input
              type="number"
              min={0}
              max={100000}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-muted">Default campaign type</span>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value as 'outbound' | 'inbound')}
            >
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </label>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void onSaveDialer()}
            disabled={savingDialer}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {savingDialer ? 'Saving…' : 'Save dialer defaults'}
          </button>
        </div>
      </Card>

      <Card
        title="OpenAI API key"
        description="Used by AI pitch features. The key is encrypted at rest and never returned to the browser; only a masked preview is shown."
      >
        <div className="grid gap-4 max-w-lg text-sm">
          <div>
            <p className="text-muted">Current</p>
            <p className="mt-1 font-mono text-sm">
              {settings.openai_api_key ? settings.openai_api_key : <span className="text-muted">— not set —</span>}
            </p>
          </div>
          <label className="block">
            <span className="text-muted">New key</span>
            <input
              type="password"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 font-mono"
              value={openAiInput}
              onChange={(e) => setOpenAiInput(e.target.value)}
              placeholder="sk-…"
            />
            <span className="mt-1 block text-xs text-muted">
              We verify the key against OpenAI before saving. Leave blank to keep the existing one.
            </span>
          </label>
          <button
            type="button"
            onClick={() => void onSaveOpenAiKey()}
            disabled={savingKey || !openAiInput.trim()}
            className="self-start rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {savingKey ? 'Verifying…' : 'Verify and save'}
          </button>
        </div>
      </Card>
    </div>
  )
}
