import { useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { MockAuthProvider } from './context/MockAuthProvider'
import { useMockAuth } from './hooks/useMockAuth'
import type { AppSection, ReportsMenuId } from './types/app'
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
import { getCampaign } from './mock/campaignsStore'

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

type CampaignNav =
  | { mode: 'list' }
  | { mode: 'wizard' }
  | { mode: 'detail'; campaignId: string }

function MainApp() {
  const { user, logout, directory } = useMockAuth()
  const [section, setSection] = useState<AppSection>('dashboard')
  const [reportsMenuId, setReportsMenuId] = useState<ReportsMenuId>('overview')
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [campaignNav, setCampaignNav] = useState<CampaignNav>({ mode: 'list' })
  const [mobileMenu, setMobileMenu] = useState(false)

  const activeSection: AppSection =
    user && section === 'users' && user.role !== 'ADMIN'
      ? 'dashboard'
      : section

  if (!user) {
    return <AuthPage />
  }

  const isAdmin = user.role === 'ADMIN'

  function handleSectionChange(s: AppSection) {
    setSection(s)
    if (s === 'dashboard') setReportsMenuId('overview')
    if (s !== 'users') setProfileUserId(null)
    if (s !== 'campaign') setCampaignNav({ mode: 'list' })
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
      if (campaignNav.mode === 'detail') {
        const c = getCampaign(campaignNav.campaignId)
        return c ? `${c.name} — Campaign` : 'Campaign'
      }
      return 'Campaign management'
    }
    if (activeSection === 'live') return 'Live Monitor'
    return undefined
  }, [activeSection, reportsMenuId, profileUserId, directory, campaignNav])

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
        return null
    }
  }

  return (
    <AppShell
      section={activeSection}
      reportsMenuId={reportsMenuId}
      pageTitle={pageTitle}
      onSectionChange={handleSectionChange}
      onReportsMenuNavigate={navigateReportsMenu}
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
    <MockAuthProvider>
      <MainApp />
    </MockAuthProvider>
  )
}
