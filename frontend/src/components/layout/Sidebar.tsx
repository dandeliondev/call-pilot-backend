import type { AppSection } from '../../types/app'

const NAV: { id: AppSection; label: string; icon: 'dash' | 'megaphone' | 'chart' | 'doc' | 'spark' | 'phone' }[] =
  [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash' },
    { id: 'campaign', label: 'Campaign Builder', icon: 'megaphone' },
    { id: 'reports', label: 'Call Reports', icon: 'chart' },
    { id: 'scripts', label: 'Script Management', icon: 'doc' },
    { id: 'insights', label: 'AI Insights', icon: 'spark' },
    { id: 'agent', label: 'Agent App', icon: 'phone' },
  ]

function Icon({
  name,
  className,
}: {
  name: (typeof NAV)[number]['icon']
  className?: string
}) {
  const c = className ?? 'h-5 w-5'
  switch (name) {
    case 'dash':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    case 'megaphone':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.018c1.131 0 2.221.427 3.046 1.195M18 13a3 3 0 110-6m0 6v4m0 0v4m0-4h4m-4 0H6" />
        </svg>
      )
    case 'chart':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'doc':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'spark':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case 'phone':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    default:
      return null
  }
}

interface SidebarProps {
  active: AppSection
  onSelect: (section: AppSection) => void
  mobileOpen: boolean
  onMobileClose: () => void
  compact?: boolean
}

export function Sidebar({
  active,
  onSelect,
  mobileOpen,
  onMobileClose,
  compact,
}: SidebarProps) {
  const handleNav = (id: AppSection) => {
    onSelect(id)
    onMobileClose()
  }

  const rail = compact ? 'md:w-20' : 'md:w-56'

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-white shadow-sm transition-transform duration-200 md:static md:z-0 md:translate-x-0 ${rail} w-56 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            CP
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">
                CallPilot
              </p>
              <p className="truncate text-xs text-muted">Demo</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                title={compact ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-slate-50 hover:text-text'
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : ''}`}
                />
                {!compact && (
                  <span className="truncate">
                    {item.id === 'agent'
                      ? 'Agent App (switch view)'
                      : item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        {!compact && (
          <div className="border-t border-border p-3">
            <p className="text-xs text-muted">
              Simulated AI — no backend
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
