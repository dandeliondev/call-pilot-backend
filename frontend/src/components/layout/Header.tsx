import type { AppSection } from '../../types/app'

const TITLES: Record<AppSection, string> = {
  dashboard: 'Dashboard',
  campaign: 'Campaign management',
  live: 'Live Monitor',
  reports: 'Reports',
  scripts: 'Script Management',
  insights: 'AI Insights',
  users: 'User management',
  agent: 'Agent App',
  profile: 'My profile',
}

interface HeaderProps {
  section: AppSection
  /** When set, overrides the default title for this section (e.g. report sub-views). */
  pageTitle?: string
  onMenuClick: () => void
  userLabel?: string
  onLogout?: () => void
  onOpenProfile?: () => void
}

export function Header({
  section,
  pageTitle,
  onMenuClick,
  userLabel,
  onLogout,
  onOpenProfile,
}: HeaderProps) {
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
            Proj-Cicero (Demo Version)
          </p>
          <h1 className="text-lg font-semibold text-text md:text-xl">
            {pageTitle ?? TITLES[section]}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {userLabel && onOpenProfile ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="hidden max-w-[220px] truncate rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-slate-100 hover:text-text sm:inline"
            title="My profile"
          >
            {userLabel}
          </button>
        ) : userLabel ? (
          <span className="hidden max-w-[200px] truncate text-xs text-muted sm:inline">
            {userLabel}
          </span>
        ) : null}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-slate-50"
          >
            Log out
          </button>
        )}
      </div>
    </header>
  )
}
