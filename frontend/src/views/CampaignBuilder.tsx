import { useState } from 'react'
import { toast } from 'sonner'
import { ScriptCategoryPanel } from '../components/campaign/ScriptCategoryPanel'
import { Card } from '../components/ui/Card'
import { SkeletonLines } from '../components/ui/Skeleton'
import { fetchPitchCategories } from '../lib/pitchApi'
import type { GeneratedCampaign } from '../mock/ai'

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
      const categories = await fetchPitchCategories({ name, description })
      setResult({ categories })
      toast.success('Pitch generated')
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Generation failed — is pitch-api running with OPENAI_API_KEY?',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card
        title="New campaign"
        description="Describe your campaign. OpenAI generates pitch segments only (greeting, intro, offer—whatever fits). Run the pitch-api service locally and set OPENAI_API_KEY."
      >
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
              rows={5}
              placeholder="Audience, product/service, tone, constraints—the model uses this to decide segment structure."
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
            Generate pitch (OpenAI)
          </button>
        </div>
      </Card>

      {loading && (
        <Card title="Generating pitch…">
          <SkeletonLines rows={5} />
        </Card>
      )}

      {result && !loading && result.categories.length > 0 && (
        <>
          <div
            className="rounded-lg border border-emerald-300 bg-lime-400 px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-black"
            role="status"
          >
            You are active
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {result.categories.map((cat) => (
              <ScriptCategoryPanel key={cat.id} category={cat} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
