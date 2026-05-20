import type { ReactNode } from 'react'
import type { AppSection, CampaignRouteState, ReportsMenuId } from '../../types/app'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  section: AppSection
  reportsMenuId: ReportsMenuId
  pageTitle?: string
  onSectionChange: (s: AppSection) => void
  onReportsMenuNavigate: (id: ReportsMenuId) => void
  campaignRoute: CampaignRouteState
  onCampaignRoute: (target: 'list' | 'wizard' | { detail: string }) => void
  mobileOpen: boolean
  onMobileOpen: () => void
  onMobileClose: () => void
  children: ReactNode
  isAdmin?: boolean
  userLabel?: string
  onLogout?: () => void
  onOpenProfile?: () => void
}

export function AppShell({
  section,
  reportsMenuId,
  pageTitle,
  onSectionChange,
  onReportsMenuNavigate,
  campaignRoute,
  onCampaignRoute,
  mobileOpen,
  onMobileOpen,
  onMobileClose,
  children,
  isAdmin = false,
  userLabel,
  onLogout,
  onOpenProfile,
}: AppShellProps) {
  const isAgent = section === 'agent'

  return (
    <div className="flex min-h-[100dvh] items-stretch bg-surface">
      <Sidebar
        active={section}
        reportsMenuId={reportsMenuId}
        onSelect={onSectionChange}
        onReportsMenuNavigate={onReportsMenuNavigate}
        campaignRoute={campaignRoute}
        onCampaignRoute={onCampaignRoute}
        mobileOpen={mobileOpen}
        onMobileClose={onMobileClose}
        compact={isAgent}
        isAdmin={isAdmin}
      />
      <div className="flex min-h-[100dvh] flex-1 flex-col md:ml-0">
        {!isAgent && (
          <Header
            section={section}
            pageTitle={pageTitle}
            onMenuClick={onMobileOpen}
            userLabel={userLabel}
            onLogout={onLogout}
            onOpenProfile={onOpenProfile}
          />
        )}
        {isAgent && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur md:px-6">
            <button
              type="button"
              onClick={onMobileOpen}
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
                  Proj-Cicero — Agent App
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSectionChange('dashboard')}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-slate-50"
              >
                Exit to dashboard
              </button>
            </div>
          </header>
        )}
        <main
          className={`flex-1 ${isAgent ? 'p-4 md:p-6' : 'p-4 md:p-6 lg:p-8'}`}
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
