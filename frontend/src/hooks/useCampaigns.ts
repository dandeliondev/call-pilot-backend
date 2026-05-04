import { useSyncExternalStore } from 'react'
import { loadCampaigns, subscribeCampaigns } from '../mock/campaignsStore'

export function useCampaigns() {
  return useSyncExternalStore(subscribeCampaigns, loadCampaigns, loadCampaigns)
}
