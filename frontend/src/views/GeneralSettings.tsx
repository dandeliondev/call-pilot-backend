import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import {
  fetchSettings,
  updateSettings,
  type AppSettings,
} from '@/lib/settingsApi'

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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading…</CardTitle>
        </CardHeader>
        <CardContent>One moment.</CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings unavailable</CardTitle>
        </CardHeader>
        <CardContent>Could not load settings.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text">General settings</h2>
        <p className="text-sm text-muted">
          Application-wide defaults and integration credentials. Admin-only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Display name and default timezone for new campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-lg gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="app-name">App name</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="default-tz">Default timezone</Label>
              <Input
                id="default-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. UTC, America/Los_Angeles, Asia/Manila"
              />
            </div>
            <Button
              type="button"
              onClick={() => void onSaveBranding()}
              disabled={savingBranding}
              className="w-fit"
            >
              {savingBranding ? 'Saving…' : 'Save branding'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dialer defaults</CardTitle>
          <CardDescription>
            Initial values used by the Campaign Wizard. Per-campaign overrides still apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-lg gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="pacing">Pacing (seconds between calls)</Label>
              <Input
                id="pacing"
                type="number"
                min={0}
                max={3600}
                value={pacing}
                onChange={(e) => setPacing(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="daily-limit">Daily call limit</Label>
              <Input
                id="daily-limit"
                type="number"
                min={0}
                max={100000}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="campaign-type">Default campaign type</Label>
              <Select
                value={campaignType}
                onValueChange={(v) => setCampaignType(v as 'outbound' | 'inbound')}
              >
                <SelectTrigger id="campaign-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => void onSaveDialer()}
              disabled={savingDialer}
            >
              {savingDialer ? 'Saving…' : 'Save dialer defaults'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API key</CardTitle>
          <CardDescription>
            Used by AI pitch features. The key is encrypted at rest and never returned to the
            browser; only a masked preview is shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-lg gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="mt-1 font-mono text-sm">
                {settings.openai_api_key
                  ? settings.openai_api_key
                  : <span className="text-muted-foreground">— not set —</span>}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="openai-key">New key</Label>
              <Input
                id="openai-key"
                type="password"
                autoComplete="off"
                value={openAiInput}
                onChange={(e) => setOpenAiInput(e.target.value)}
                placeholder="sk-…"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                We verify the key against OpenAI before saving. Leave blank to keep the existing one.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => void onSaveOpenAiKey()}
              disabled={savingKey || !openAiInput.trim()}
              className="w-fit"
            >
              {savingKey ? 'Verifying…' : 'Verify and save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
