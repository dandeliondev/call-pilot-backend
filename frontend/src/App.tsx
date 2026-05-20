import { useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './context/AuthProvider'
import { CampaignsProvider } from './context/CampaignsProvider'
import { MockAuthProvider } from './context/MockAuthProvider'
import { useAuth } from './hooks/useAuth'
import { useMockAuth } from './hooks/useMockAuth'
import type { AppSection, CampaignRouteState, ReportsMenuId } from './types/app'
import { AIInsights } from './views/AIInsights'
import { AgentApp } from './views/AgentApp'
import { AuthPage } from './views/AuthPage'
import { CampaignDetail } from './views/CampaignDetail'
import { CampaignManagement } from './views/CampaignManagement'
import { CampaignWizard } from './views/CampaignWizard'
import { Dashboard } from './views/Dashboard'
import { LiveMonitor } from './views/LiveMonitor'
import { ReportsHub } from './views/ReportsHub'
import { ScriptManagement } from './views/ScriptManagement'
import { UserManagement } from './views/UserManagement'
import { UserProfile } from './views/UserProfile'
const REPORT_PAGE_TITLES: Record<ReportsMenuId, string> = {
  overview: 'Overview (Dashboard)',
  calls: 'Calls',
  conversion: 'Conversion',
  agents: 'Agents',
  scripts: 'Scripts',
  insights: 'AI Insights',
  campaigns: 'Campaigns',
  funnel: 'Funnel',
  sentiment: 'Sentiment',
}

function MainApp() {
  const { user, status, logout } = useAuth()
  const { directory } = useMockAuth()
  const [section, setSection] = useState<AppSection>('dashboard')
  const [reportsMenuId, setReportsMenuId] = useState<ReportsMenuId>('overview')
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [campaignNav, setCampaignNav] = useState<CampaignRouteState>({ mode: 'list' })
  const [mobileMenu, setMobileMenu] = useState(false)

  // Keep navigation state deterministic across auth transitions.
  useEffect(() => {
    setSection('dashboard')
    setReportsMenuId('overview')
    setProfileUserId(null)
    setCampaignNav({ mode: 'list' })
    setMobileMenu(false)
  }, [user?.id])

  const activeSection: AppSection =
    user && section === 'users' && user.role !== 'ADMIN'
      ? 'dashboard'
      : section

  const isAdmin = user?.role === 'ADMIN'

  function handleSectionChange(s: AppSection) {
    setSection(s)
    if (s === 'dashboard') setReportsMenuId('overview')
    if (s !== 'users') setProfileUserId(null)
    // Keep list/detail when leaving Campaigns so Live Monitor (etc.) stays put when switching
    // the sidebar campaign; only drop an in-progress wizard when navigating away.
    setCampaignNav((prev) =>
      s !== 'campaign' && prev.mode === 'wizard' ? { mode: 'list' } : prev,
    )
  }

  function navigateReportsMenu(id: ReportsMenuId) {
    setReportsMenuId(id)
    if (id === 'overview') {
      setSection('dashboard')
    } else if (id === 'insights') {
      setSection('insights')
    } else {
      setSection('reports')
    }
  }

  function navigateCampaignRoute(target: 'list' | 'wizard' | { detail: string }) {
    setMobileMenu(false)
    if (target === 'list') {
      setSection('campaign')
      setCampaignNav({ mode: 'list' })
      return
    }
    if (target === 'wizard') {
      setSection('campaign')
      setCampaignNav({ mode: 'wizard' })
      return
    }
    setCampaignNav({ mode: 'detail', campaignId: target.detail })
    if (activeSection === 'campaign') {
      return
    }
    // From Live Monitor, only update selected campaign (stay on live). Else open campaign detail.
    if (activeSection === 'live') {
      return
    }
    setSection('campaign')
  }

  const pageTitle = useMemo(() => {
    if (activeSection === 'dashboard') return REPORT_PAGE_TITLES.overview
    if (activeSection === 'insights') return REPORT_PAGE_TITLES.insights
    if (activeSection === 'reports') return REPORT_PAGE_TITLES[reportsMenuId]
    if (activeSection === 'users' && profileUserId) {
      const u = directory.find((d) => d.id === profileUserId)
      return u ? `${u.name} — User profile` : 'User profile'
    }
    if (activeSection === 'campaign') {
      if (campaignNav.mode === 'wizard') return 'Create campaign'
      if (campaignNav.mode === 'detail') return 'Campaign details'
      return 'Campaign management'
    }
    if (activeSection === 'live') return 'Live Monitor'
    return undefined
  }, [activeSection, reportsMenuId, profileUserId, directory, campaignNav])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  function renderSection() {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onOpenLive={() => setSection('live')} />
      case 'live':
        return <LiveMonitor />
      case 'campaign':
        if (campaignNav.mode === 'wizard') {
          return (
            <CampaignWizard
              onCancel={() => setCampaignNav({ mode: 'list' })}
              onComplete={(id) => setCampaignNav({ mode: 'detail', campaignId: id })}
            />
          )
        }
        if (campaignNav.mode === 'detail') {
          return (
            <CampaignDetail
              campaignId={campaignNav.campaignId}
              onBack={() => setCampaignNav({ mode: 'list' })}
            />
          )
        }
        return (
          <CampaignManagement
            onCreate={() => setCampaignNav({ mode: 'wizard' })}
            onOpenCampaign={(id) => setCampaignNav({ mode: 'detail', campaignId: id })}
          />
        )
      case 'reports':
        return <ReportsHub menuId={reportsMenuId} />
      case 'scripts':
        return <ScriptManagement />
      case 'insights':
        return <AIInsights onOpenScripts={() => setSection('scripts')} />
      case 'users':
        if (!isAdmin) return <Dashboard />
        if (profileUserId) {
          return (
            <UserProfile
              userId={profileUserId}
              onBack={() => setProfileUserId(null)}
            />
          )
        }
        return <UserManagement onOpenProfile={(id) => setProfileUserId(id)} />
      case 'agent':
        return <AgentApp />
      default:
        return <Dashboard onOpenLive={() => setSection('live')} />
    }
  }

  return (
    <AppShell
      section={activeSection}
      reportsMenuId={reportsMenuId}
      pageTitle={pageTitle}
      onSectionChange={handleSectionChange}
      onReportsMenuNavigate={navigateReportsMenu}
      campaignRoute={campaignNav}
      onCampaignRoute={navigateCampaignRoute}
      mobileOpen={mobileMenu}
      onMobileOpen={() => setMobileMenu(true)}
      onMobileClose={() => setMobileMenu(false)}
      isAdmin={isAdmin}
      userLabel={`${user.name} (${user.email})`}
      onLogout={logout}
    >
      {renderSection()}
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MockAuthProvider>
        <CampaignsProvider>
          <MainApp />
        </CampaignsProvider>
      </MockAuthProvider>
    </AuthProvider>
  )
}
