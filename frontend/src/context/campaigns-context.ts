import { createContext } from 'react'
import type { ManagedCampaign } from '../types/app'
import type { DirectoryUser } from '../lib/campaignsApi'

export interface CampaignsState {
  campaigns: ManagedCampaign[]
  loaded: boolean
  agents: DirectoryUser[]
  managers: DirectoryUser[]
  refresh: () => Promise<void>
  refreshDirectories: () => Promise<void>
  createCampaign: (
    payload: Omit<ManagedCampaign, 'id' | 'createdAt'>,
  ) => Promise<ManagedCampaign>
  updateCampaign: (
    id: string,
    patch: Partial<Omit<ManagedCampaign, 'id' | 'createdAt'>>,
  ) => Promise<ManagedCampaign>
  getCampaign: (id: string) => ManagedCampaign | undefined
}

export const CampaignsContext = createContext<CampaignsState | null>(null)
