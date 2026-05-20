import { useContext } from 'react'
import { CampaignsContext } from '../context/campaigns-context'

export function useCampaigns() {
  const ctx = useContext(CampaignsContext)
  if (!ctx) {
    throw new Error('useCampaigns must be used inside <CampaignsProvider>')
  }
  return ctx.campaigns
}

export function useCampaignsContext() {
  const ctx = useContext(CampaignsContext)
  if (!ctx) {
    throw new Error('useCampaignsContext must be used inside <CampaignsProvider>')
  }
  return ctx
}
