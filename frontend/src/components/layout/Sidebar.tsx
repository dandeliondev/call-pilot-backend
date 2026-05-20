import { useEffect, useState } from 'react'
import { useCampaigns } from '../../hooks/useCampaigns'
import type { AppSection, CampaignRouteState, ReportsMenuId } from '../../types/app'

type NavIcon =
  | 'dash'
  | 'megaphone'
  | 'live'
  | 'chart'
  | 'doc'
  | 'spark'
  | 'users'
  | 'phone'
  | 'cog'

const NAV_MAIN: {
  id: AppSection
  label: string
  icon: NavIcon
  adminOnly?: boolean
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dash' },
  { id: 'live', label: 'Live Monitor', icon: 'live' },
  { id: 'scripts', label: 'Script Management', icon: 'doc' },
  { id: 'users', label: 'User management', icon: 'users', adminOnly: true },
  { id: 'settings', label: 'General settings', icon: 'cog', adminOnly: true },
  { id: 'agent', label: 'Agent App', icon: 'phone' },
]

/** 📊 Reports Menu — order matches product spec */
const REPORT_MENU: { id: ReportsMenuId; label: string }[] = [
  { id: 'overview', label: 'Overview (Dashboard)' },
  { id: 'calls', label: 'Calls' },
  { id: 'conversion', label: 'Conversion' },
  { id: 'agents', label: 'Agents' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'insights', label: 'AI Insights' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'sentiment', label: 'Sentiment' },
]

function Icon({
  name,
  className,
}: {
  name: NavIcon
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
    case 'live':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
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
    case 'users':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    case 'phone':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    case 'cog':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    default:
      return null
  }
}

function isReportsSubActive(
  active: AppSection,
  reportsMenuId: ReportsMenuId,
  id: ReportsMenuId,
): boolean {
  if (id === 'overview') return active === 'dashboard'
  if (id === 'insights') return active === 'insights'
  return active === 'reports' && reportsMenuId === id
}

interface SidebarProps {
  active: AppSection
  reportsMenuId: ReportsMenuId
  onSelect: (section: AppSection) => void
  onReportsMenuNavigate: (id: ReportsMenuId) => void
  campaignRoute: CampaignRouteState
  onCampaignRoute: (target: 'list' | 'wizard' | { detail: string }) => void
  mobileOpen: boolean
  onMobileClose: () => void
  compact?: boolean
  isAdmin?: boolean
}

export function Sidebar({
  active,
  reportsMenuId,
  onSelect,
  onReportsMenuNavigate,
  campaignRoute,
  onCampaignRoute,
  mobileOpen,
  onMobileClose,
  compact,
  isAdmin = false,
}: SidebarProps) {
  const campaigns = useCampaigns()
  const reportsMenuActive =
    active === 'reports' || active === 'dashboard' || active === 'insights'

  const campaignSectionActive = active === 'campaign'

  const [reportsOpen, setReportsOpen] = useState(true)
  const [campaignsOpen, setCampaignsOpen] = useState(true)

  useEffect(() => {
    if (reportsMenuActive) setReportsOpen(true)
  }, [reportsMenuActive])

  useEffect(() => {
    if (campaignSectionActive) setCampaignsOpen(true)
  }, [campaignSectionActive])

  const visibleMain = NAV_MAIN.filter((item) => !item.adminOnly || isAdmin)

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
        className={`fixed inset-y-0 left-0 z-50 flex min-h-[100dvh] flex-col border-r border-slate-700/70 bg-gradient-to-b from-slate-900 via-slate-900 to-[#0f172a] shadow-[4px_0_24px_-4px_rgba(15,23,42,0.45)] transition-transform duration-200 md:static md:inset-auto md:z-0 md:min-h-[100dvh] md:self-stretch md:translate-x-0 ${rail} w-56 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-700/60 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25">
            PC
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Proj-Cicero</p>
              <p className="truncate text-xs text-slate-400">Demo</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {visibleMain.slice(0, 2).map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                title={compact ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/25 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-sky-300' : 'text-slate-500'}`}
                />
                {!compact && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}

          {compact ? (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  onCampaignRoute('list')
                  onMobileClose()
                }}
                title="Campaigns"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  campaignSectionActive &&
                  (campaignRoute.mode === 'list' || campaignRoute.mode === 'detail')
                    ? 'bg-primary/25 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                }`}
              >
                <Icon
                  name="megaphone"
                  className={`h-5 w-5 shrink-0 ${
                    campaignSectionActive &&
                    (campaignRoute.mode === 'list' || campaignRoute.mode === 'detail')
                      ? 'text-sky-300'
                      : 'text-slate-500'
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  onCampaignRoute('wizard')
                  onMobileClose()
                }}
                title="Add new campaign"
                className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  campaignSectionActive && campaignRoute.mode === 'wizard'
                    ? 'bg-primary/25 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                }`}
              >
                <span className="text-lg font-light leading-none">+</span>
              </button>
            </div>
          ) : (
            <div className="pt-0.5">
              <div
                className={`flex w-full items-stretch overflow-hidden rounded-lg ${
                  campaignSectionActive
                    ? 'bg-primary/25 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                    : 'text-slate-400'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onCampaignRoute('list')
                    onMobileClose()
                    setCampaignsOpen(true)
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    campaignSectionActive
                      ? 'text-white'
                      : 'hover:bg-white/[0.06] hover:text-slate-100'
                  }`}
                >
                  <Icon
                    name="megaphone"
                    className={`h-5 w-5 shrink-0 ${campaignSectionActive ? 'text-sky-300' : 'text-slate-500'}`}
                  />
                  <span className="truncate">Campaigns</span>
                </button>
                <button
                  type="button"
                  aria-expanded={campaignsOpen}
                  aria-label={campaignsOpen ? 'Collapse campaign list' : 'Expand campaign list'}
                  onClick={() => setCampaignsOpen((o) => !o)}
                  className={`shrink-0 border-l px-2.5 transition-colors ${
                    campaignSectionActive
                      ? 'border-sky-500/30 text-sky-200 hover:bg-white/10'
                      : 'border-slate-600/60 text-slate-500 hover:bg-white/[0.06] hover:text-slate-100'
                  }`}
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${campaignsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {campaignsOpen && (
                <div className="ml-2 mt-0.5 space-y-0.5 border-l border-slate-600 pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      onCampaignRoute('wizard')
                      onMobileClose()
                    }}
                    className={`flex w-full rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors ${
                      campaignSectionActive && campaignRoute.mode === 'wizard'
                        ? 'bg-primary/20 text-sky-200'
                        : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    Add New
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCampaignRoute('list')
                      onMobileClose()
                    }}
                    className={`flex w-full rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors ${
                      campaignSectionActive && campaignRoute.mode === 'list'
                        ? 'bg-primary/20 text-sky-200'
                        : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    All campaigns
                  </button>
                  {campaigns.length === 0 ? (
                    <p className="px-2 py-1 text-[11px] text-slate-600">No campaigns yet</p>
                  ) : (
                    campaigns.map((c) => {
                      const isSubActive =
                        campaignRoute.mode === 'detail' && campaignRoute.campaignId === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onCampaignRoute({ detail: c.id })
                            onMobileClose()
                          }}
                          className={`flex w-full rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors ${
                            isSubActive
                              ? 'bg-primary/20 text-sky-200'
                              : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate" title={c.name}>
                            {c.name}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (compact) {
                  onReportsMenuNavigate('calls')
                  onMobileClose()
                } else {
                  setReportsOpen((o) => !o)
                }
              }}
              title={compact ? 'Reports' : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                reportsMenuActive
                  ? 'bg-primary/25 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
              }`}
            >
              <Icon
                name="chart"
                className={`h-5 w-5 shrink-0 ${reportsMenuActive ? 'text-sky-300' : 'text-slate-500'}`}
              />
              {!compact && (
                <>
                  <span className="flex-1 truncate text-left">Reports</span>
                  <svg
                    className={`h-4 w-4 shrink-0 transition-transform ${reportsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {reportsOpen && !compact && (
              <div className="ml-2 mt-0.5 space-y-0.5 border-l border-slate-600 pl-2">
                {REPORT_MENU.map(({ id, label }) => {
                  const isSubActive = isReportsSubActive(active, reportsMenuId, id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onReportsMenuNavigate(id)
                        onMobileClose()
                      }}
                      className={`flex w-full rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors ${
                        isSubActive
                          ? 'bg-primary/20 text-sky-200'
                          : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {visibleMain.slice(2).map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                title={compact ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/25 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-sky-300' : 'text-slate-500'}`}
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
          <div className="border-t border-slate-700/60 p-3">
            <p className="text-xs text-slate-500">
              Auth & users: browser demo · AI simulated
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
