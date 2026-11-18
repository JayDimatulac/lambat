import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

export type Outcomes = Record<'ACTIVE' | 'SOLD' | 'REDISTRIBUTED' | 'PROCESSED' | 'DISCARDED', number>

export type AdminActivity = {
  kind: 'buyer' | 'user' | 'advisory' | 'catch'
  title: string
  sub: string
  at: string
}

export type AdminOverview = {
  landed: { kg: number; count: number; thisWeek: number }
  outcomes: Outcomes
  lossRatePct: number
  valueRecovered: number
  accountsWaiting: number
  atRisk: number
  riskNow: Record<'low' | 'moderate' | 'high' | 'critical' | 'unknown', number>
  weeks: { weekStart: string; kg: Outcomes }[]
  lostBySpecies: { name: string; kg: number }[]
  areas: { name: string; kg: number; lostKg: number; lossPct: number }[]
  lastAdvisory: { title: string; createdAt: string } | null
  activity: AdminActivity[]
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

// Tonnes for big totals, kilos for small ones, so a 30 kg day never reads as "0.0 t"
export function fmtWeight(kg: number): { value: string; unit: 't' | 'kg' } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(1), unit: 't' }
  return { value: Math.round(kg).toLocaleString('en-PH'), unit: 'kg' }
}

// "10:24 am" for today, "Yesterday", then "Nov 10"
export function whenLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(d)
  day.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000)
  if (diff <= 0) return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export const weekLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })