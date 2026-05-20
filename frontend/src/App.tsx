import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { CampaignsProvider } from './context/CampaignsProvider'
import { UsersProvider } from './context/UsersProvider'
import { router } from './routes/router'

export default function App() {
  return (
    <AuthProvider>
      <UsersProvider>
        <CampaignsProvider>
          <RouterProvider router={router} />
        </CampaignsProvider>
      </UsersProvider>
    </AuthProvider>
  )
}
