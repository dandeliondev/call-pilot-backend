import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import type { AppSection } from './types/app'
import { Dashboard } from './views/Dashboard'
import { CampaignBuilder } from './views/CampaignBuilder'
import { CallReports } from './views/CallReports'
import { ScriptManagement } from './views/ScriptManagement'
import { AIInsights } from './views/AIInsights'
import { AgentApp } from './views/AgentApp'

export default function App() {
  const [section, setSection] = useState<AppSection>('dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)

  function renderSection() {
    switch (section) {
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
      case 'agent':
        return <AgentApp />
      default:
        return null
    }
  }

  return (
    <AppShell
      section={section}
      onSectionChange={setSection}
      mobileOpen={mobileMenu}
      onMobileOpen={() => setMobileMenu(true)}
      onMobileClose={() => setMobileMenu(false)}
    >
      {renderSection()}
    </AppShell>
  )
}
