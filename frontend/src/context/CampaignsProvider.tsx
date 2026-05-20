import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  createCampaignApi,
  fetchAgents,
  fetchCampaignManagers,
  fetchCampaigns,
  updateCampaignApi,
  type DirectoryUser,
} from '../lib/campaignsApi'
import type { ManagedCampaign } from '../types/app'
import { CampaignsContext } from './campaigns-context'

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [campaigns, setCampaigns] = useState<ManagedCampaign[]>([])
  const [loaded, setLoaded] = useState(false)
  const [agents, setAgents] = useState<DirectoryUser[]>([])
  const [managers, setManagers] = useState<DirectoryUser[]>([])

  const refresh = useCallback(async () => {
    const list = await fetchCampaigns()
    setCampaigns(list)
    setLoaded(true)
  }, [])

  const refreshDirectories = useCallback(async () => {
    const [a, m] = await Promise.all([fetchAgents(), fetchCampaignManagers()])
    setAgents(a)
    setManagers(m)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') {
      setCampaigns([])
      setLoaded(false)
      setAgents([])
      setManagers([])
      return
    }
    void refresh()
    void refreshDirectories()
  }, [status, refresh, refreshDirectories])

  const createCampaign = useCallback(
    async (payload: Omit<ManagedCampaign, 'id' | 'createdAt'>) => {
      const created = await createCampaignApi(payload)
      setCampaigns((prev) => [created, ...prev])
      return created
    },
    [],
  )

  const updateCampaign = useCallback(
    async (
      id: string,
      patch: Partial<Omit<ManagedCampaign, 'id' | 'createdAt'>>,
    ) => {
      const updated = await updateCampaignApi(id, patch)
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)))
      return updated
    },
    [],
  )

  const getCampaign = useCallback(
    (id: string) => campaigns.find((c) => c.id === id),
    [campaigns],
  )

  const value = useMemo(
    () => ({
      campaigns,
      loaded,
      agents,
      managers,
      refresh,
      refreshDirectories,
      createCampaign,
      updateCampaign,
      getCampaign,
    }),
    [
      campaigns,
      loaded,
      agents,
      managers,
      refresh,
      refreshDirectories,
      createCampaign,
      updateCampaign,
      getCampaign,
    ],
  )

  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>
}
