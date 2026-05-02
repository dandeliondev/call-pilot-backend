import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { MockAuthProvider } from './context/MockAuthProvider'
import { useMockAuth } from './hooks/useMockAuth'
import type { AppSection } from './types/app'
import { AIInsights } from './views/AIInsights'
import { AgentApp } from './views/AgentApp'
import { AuthPage } from './views/AuthPage'
import { CallReports } from './views/CallReports'
import { CampaignBuilder } from './views/CampaignBuilder'
import { Dashboard } from './views/Dashboard'
import { ScriptManagement } from './views/ScriptManagement'
import { UserManagement } from './views/UserManagement'

function MainApp() {
  const { user, logout } = useMockAuth()
  const [section, setSection] = useState<AppSection>('dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)

  const activeSection: AppSection =
    user && section === 'users' && user.role !== 'ADMIN'
      ? 'dashboard'
      : section

  if (!user) {
    return <AuthPage />
  }

  const isAdmin = user.role === 'ADMIN'

  function renderSection() {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'campaign':
        return <CampaignBuilder />
      case 'reports':
        return <CallReports />
      case 'scripts':
        return <ScriptManagement />
      case 'insights':
        return <AIInsights />
      case 'users':
        return isAdmin ? <UserManagement /> : <Dashboard />
      case 'agent':
        return <AgentApp />
      default:
        return null
    }
  }

  return (
    <AppShell
      section={activeSection}
      onSectionChange={setSection}
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
