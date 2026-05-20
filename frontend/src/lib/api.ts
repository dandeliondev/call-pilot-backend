const API_BASE =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:8000'

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
  )
  return match ? decodeURIComponent(match[1]!) : null
}

let csrfPromise: Promise<void> | null = null

async function ensureCsrf(): Promise<void> {
  if (getCookie('XSRF-TOKEN')) return
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }).then(() => undefined)
    csrfPromise.finally(() => {
      csrfPromise = null
    })
  }
  await csrfPromise
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const mutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'

  if (mutating) await ensureCsrf()

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Requested-With', 'XMLHttpRequest')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (mutating) {
    const xsrf = getCookie('XSRF-TOKEN')
    if (xsrf) headers.set('X-XSRF-TOKEN', xsrf)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = text
  }

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`
    throw new ApiError(message, res.status, body)
  }

  return body as T
}
