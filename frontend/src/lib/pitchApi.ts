import type { ScriptCategory } from '../mock/ai'

/**
 * Calls the pitch-api service (OpenAI). Vite dev proxies /api → pitch-api.
 * In production, serve the API on the same origin or set VITE_API_BASE.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export async function fetchPitchCategories(input: {
  name: string
  description: string
}): Promise<ScriptCategory[]> {
  const url = `${API_BASE}/api/campaign/pitch`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name.trim(),
      description: input.description.trim(),
    }),
  })

  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = undefined
  }

  if (!res.ok) {
    const err =
      body &&
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed (${res.status})`
    throw new Error(err)
  }

  if (
    body &&
    typeof body === 'object' &&
    'categories' in body &&
    Array.isArray((body as { categories: unknown }).categories)
  ) {
    return (body as { categories: ScriptCategory[] }).categories
  }

  throw new Error('Unexpected response shape')
}
