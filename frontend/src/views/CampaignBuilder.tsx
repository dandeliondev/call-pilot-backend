import { useState } from 'react'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { SkeletonLines } from '../components/ui/Skeleton'
import { generateCampaign, type GeneratedCampaign } from '../mock/ai'

export function CampaignBuilder() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedCampaign | null>(null)

  async function onGenerate() {
    if (!name.trim() || !description.trim()) {
      toast.error('Please enter campaign name and description.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const data = await generateCampaign({ name, description })
      setResult(data)
      toast.success('Campaign draft generated')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card title="New campaign" description="Describe your goals — AI output is simulated for this demo.">
        <div className="space-y-4">
          <div>
            <label htmlFor="cname" className="mb-1.5 block text-sm font-medium text-text">
              Campaign name
            </label>
            <input
              id="cname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 renewal outreach"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="cdesc" className="mb-1.5 block text-sm font-medium text-text">
              Description
            </label>
            <textarea
              id="cdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Audience, offer, constraints…"
              className="w-full resize-y rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
            />
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Generate with AI
          </button>
        </div>
      </Card>

      {loading && (
        <div className="grid gap-4 md:grid-cols-1">
          <Card title="Generating…">
            <SkeletonLines rows={4} />
          </Card>
        </div>
      )}

      {result && !loading && (
        <div className="grid gap-4 lg:grid-cols-1">
          <Card title="Generated call script">
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-text">
              {result.script}
            </pre>
          </Card>
          <Card title="Objection handling">
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-text">
              {result.objectionHandling}
            </pre>
          </Card>
          <Card title="Call flow">
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-text">
              {result.callFlow}
            </pre>
          </Card>
        </div>
      )}
    </div>
  )
}
