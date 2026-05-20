import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

/**
 * Authenticated shell. Sidebar/Header read their own state from the router and
 * auth hooks — the shell itself only owns the mobile-menu open/close.
 *
 * Agent App (`/agent`) gets a different chrome (no top header, compact sidebar).
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isAgent = location.pathname.startsWith('/agent')

  return (
    <div className="flex min-h-[100dvh] items-stretch bg-surface">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        compact={isAgent}
      />
      <div className="flex min-h-[100dvh] flex-1 flex-col md:ml-0">
        {!isAgent && <Header onMenuClick={() => setMobileOpen(true)} />}
        {isAgent && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur md:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex rounded-lg p-2 text-text hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-1 items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted">Agent workspace</p>
                <p className="text-sm font-semibold text-text">
                  ProSpeaking — Agent App
                </p>
              </div>
              <AgentExitButton />
            </div>
          </header>
        )}
        <main className={`flex-1 ${isAgent ? 'p-4 md:p-6' : 'p-4 md:p-6 lg:p-8'}`}>
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function AgentExitButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/dashboard')}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-slate-50"
    >
      Exit to dashboard
    </button>
  )
}
