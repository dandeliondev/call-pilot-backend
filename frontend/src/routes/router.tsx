import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AIInsights } from '../views/AIInsights'
import { AgentApp } from '../views/AgentApp'
import { AuthPage } from '../views/AuthPage'
import { CampaignDetail } from '../views/CampaignDetail'
import { CampaignManagement } from '../views/CampaignManagement'
import { CampaignWizard } from '../views/CampaignWizard'
import { Dashboard } from '../views/Dashboard'
import { GeneralSettings } from '../views/GeneralSettings'
import { InviteAcceptPage } from '../views/InviteAcceptPage'
import { LiveMonitor } from '../views/LiveMonitor'
import { MyProfile } from '../views/MyProfile'
import { ReportsHub } from '../views/ReportsHub'
import { ScriptManagement } from '../views/ScriptManagement'
import { UserManagement } from '../views/UserManagement'
import { UserProfile } from '../views/UserProfile'
import { AdminRoute } from './AdminRoute'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicLayout } from './PublicLayout'

/**
 * Route tree. The `handle.title` on each leaf is read by Header via useMatches()
 * to compute the page title — colocated with the route declaration so adding a
 * page is a one-stop edit.
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout requireGuest />,
    children: [
      { path: '/login', element: <AuthPage />, handle: { title: 'Sign in' } },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: '/invite/:token', element: <InviteAcceptPage />, handle: { title: 'Accept invitation' } },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard />, handle: { title: 'Dashboard' } },
          { path: 'live', element: <LiveMonitor />, handle: { title: 'Live Monitor' } },
          { path: 'campaigns', element: <CampaignManagement />, handle: { title: 'Campaign management' } },
          { path: 'campaigns/new', element: <CampaignWizard />, handle: { title: 'Create campaign' } },
          { path: 'campaigns/:id', element: <CampaignDetail />, handle: { title: 'Campaign details' } },
          { path: 'reports/:menu', element: <ReportsHub />, handle: { title: 'Reports' } },
          { path: 'reports', element: <Navigate to="/reports/calls" replace /> },
          { path: 'insights', element: <AIInsights />, handle: { title: 'AI Insights' } },
          { path: 'scripts', element: <ScriptManagement />, handle: { title: 'Script Management' } },
          { path: 'agent', element: <AgentApp />, handle: { title: 'Agent App' } },
          { path: 'profile', element: <MyProfile />, handle: { title: 'My profile' } },
          {
            element: <AdminRoute />,
            children: [
              { path: 'users', element: <UserManagement />, handle: { title: 'User management' } },
              { path: 'users/:id', element: <UserProfile />, handle: { title: 'User profile' } },
              { path: 'settings', element: <GeneralSettings />, handle: { title: 'General settings' } },
            ],
          },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
])
