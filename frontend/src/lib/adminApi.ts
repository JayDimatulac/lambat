import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

type Kg = Record<'ACTIVE' | 'SOLD' | 'REDISTRIBUTED' | 'PROCESSED' | 'DISCARDED', number>

export type AdminOverview = {
  landed: { kg: number; count: number; thisWeek: number }
  outcomes: Kg
  lossRatePct: number
  valueRecovered: number
  accountsWaiting: number
  atRisk: number
  riskNow: Record<'low' | 'moderate' | 'high' | 'critical' | 'unknown', number>
  weeks: { weekStart: string; kg: Kg }[]
  lostBySpecies: { name: string; kg: number }[]
  areas: { name: string; kg: number; lostKg: number; lossPct: number }[]
  lastAdvisory: { title: string; createdAt: string } | null
  activity: { kind: 'buyer' | 'user' | 'advisory' | 'catch'; title: string; sub: string; at: string }[]
}

export const getAdminOverview = () => api.get<AdminOverview>('/admin/overview')

// loads on mount and refreshes every minute
export function useAdminOverview() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await getAdminOverview())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  return { data, error, loading: data === null && error === null, reload: load }
}

export const fmtTons = (kg: number) => (kg / 1000).toFixed(1)
export const fmtPeso = (v: number) => (v >= 1000 ? `₱${Math.round(v / 1000)}k` : `₱${v}`)