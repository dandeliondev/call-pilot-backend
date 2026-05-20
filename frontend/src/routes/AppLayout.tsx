import { Outlet } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

/**
 * Authenticated layout: renders the AppShell once and hands the routed view
 * tree to the shell's `<Outlet />`. AppShell owns the sidebar/header/main
 * regions; per-page nav state lives in the URL.
 */
export function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
