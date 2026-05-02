import type { AppSection } from '../../types/app'

const TITLES: Record<AppSection, string> = {
  dashboard: 'Dashboard',
  campaign: 'Campaign Builder',
  reports: 'Call Reports',
  scripts: 'Script Management',
  insights: 'AI Insights',
  agent: 'Agent App',
}

interface HeaderProps {
  section: AppSection
  onMenuClick: () => void
}

export function Header({ section, onMenuClick }: HeaderProps) {
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
            CallPilot (Demo Version)
          </p>
          <h1 className="text-lg font-semibold text-text md:text-xl">
            {TITLES[section]}
          </h1>
        </div>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Live preview
        </span>
      </div>
    </header>
  )
}
