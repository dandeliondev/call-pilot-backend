import { useMatches, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface HeaderProps {
  onMenuClick: () => void
}

function pageTitle(matches: ReturnType<typeof useMatches>): string {
  // useMatches returns the matched route stack — innermost last. Walk
  // backwards to find the deepest handle.title, so /campaigns/:id beats
  // /campaigns.
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i]?.handle as { title?: string } | undefined
    if (handle?.title) return handle.title
  }
  return ''
}

export function Header({ onMenuClick }: HeaderProps) {
  const matches = useMatches()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const title = pageTitle(matches)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-white/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex rounded-lg p-2 text-text hover:bg-slate-100 md:hidden"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            ProSpeaking (Demo Version)
          </p>
          <h1 className="text-lg font-semibold text-text md:text-xl">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="hidden max-w-[220px] truncate rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-slate-100 hover:text-text sm:inline"
            title="My profile"
          >
            {user.name} ({user.email})
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            void logout()
            navigate('/login', { replace: true })
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </header>
  )
}
