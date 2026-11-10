import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'
import { BASE_PRICE } from './buyers'
import type { Need } from './market'

// The real meeting place between buyers and fisherfolk: every function here is a request to the backend.

export type When = 'today' | 'tomorrow' | 'week'

/* ---------- fisherfolk: scan for buyers ---------- */

export type MatchedNeed = {
  id: string
  buyerId: string
  kilos: number
  pricePerKg: number | null
  neededBy: string | null
  barangay: string
  note: string | null
  createdAt: string
  sameBarangay: boolean
  species: { id: string; englishName: string; localNames: string[] }
  buyer: { id: string; businessName: string | null; buyerType: string | null; barangay: string }
}

export const buyerName = (n: MatchedNeed) => n.buyer.businessName || 'A buyer'

// The name a fisherfolk knows the fish by ("Galunggong"), or the English name if it has no local name we use
export const fishName = (s: { englishName: string; localNames: string[] }) => s.localNames.find((x) => x in BASE_PRICE) ?? s.englishName

/* Asks the server for the open buyer needs that fit one catch, and asks again every few seconds (the "scan"). */
export function useNeedMatches(catchId: string | undefined, everyMs = 15000) {
  const [needs, setNeeds] = useState<MatchedNeed[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scannedAt, setScannedAt] = useState<number | null>(null)

  const scan = useCallback(async () => {
    if (!catchId) return
    setLoading(true)
    try {
      setNeeds(await api.get<MatchedNeed[]>(`/needs/matches?catchId=${encodeURIComponent(catchId)}`))
      setError('')
      setScannedAt(Date.now())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not scan for buyers')
    } finally {
      setLoading(false)
    }
  }, [catchId])

  useEffect(() => {
    setNeeds([]) // a different catch means a different list
    scan()
    const id = setInterval(() => { if (!document.hidden) scan() }, everyMs)
    return () => clearInterval(id)
  }, [scan, everyMs])

  return { needs, loading, error, scannedAt, scan }
}

/* ---------- offers ---------- */

export type ApiOffer = {
  id: string
  catchId: string
  needId: string | null
  kilos: number
  pricePerKg: number
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'WITHDRAWN'
  createdAt: string
  respondedAt: string | null
  catch?: { species: { englishName: string; localNames: string[] } }
}

export const sendOffer = (b: { catchId: string; buyerId: string; needId: string; kilos: number; pricePerKg: number }) =>
  api.post<ApiOffer>('/offers', b)

/* The offers I sent (fisherfolk). Newest first. Asks again every 20 seconds so an answer from the buyer shows up. */
export function useMyOffers(everyMs = 20000) {
  const [offers, setOffers] = useState<ApiOffer[]>([])
  const reload = useCallback(async () => {
    try { setOffers(await api.get<ApiOffer[]>('/offers/mine')) } catch { /* keep the old list */ }
  }, [])
  useEffect(() => {
    reload()
    const id = setInterval(() => { if (!document.hidden) reload() }, everyMs)
    return () => clearInterval(id)
  }, [reload, everyMs])
  return { offers, reload }
}

/* ---------- buyers: post what you need ---------- */

type ApiSpecies = { id: string; code: string | null; englishName: string; localNames: string[] }
let speciesCache: Promise<ApiSpecies[]> | null = null
const loadSpecies = () => {
  if (!speciesCache) speciesCache = api.get<ApiSpecies[]>('/species').catch((e) => { speciesCache = null; throw e })
  return speciesCache
}

// A buyer picks a local name like "Galunggong". The server wants a species id, so find one that carries that name.
async function speciesIdFor(localName: string) {
  const all = await loadSpecies()
  const k = localName.toLowerCase()
  return all.find((s) => s.localNames.some((n) => n.toLowerCase() === k))?.id
}

const DAYS: Record<When, number> = { today: 0, tomorrow: 1, week: 7 }
const neededByFor = (when: When) => {
  const d = new Date()
  d.setDate(d.getDate() + DAYS[when])
  d.setHours(23, 59, 0, 0) // the end of that day
  return d.toISOString()
}
export const whenFrom = (neededBy: string | null): When => {
  if (!neededBy) return 'week'
  const days = Math.ceil((new Date(neededBy).getTime() - Date.now()) / 86_400_000)
  return days <= 0 ? 'today' : days === 1 ? 'tomorrow' : 'week'
}

export async function postNeed(i: { fish: string; kg: number; when: When; maxPrice?: number; place: string }) {
  const speciesId = await speciesIdFor(i.fish)
  if (!speciesId) throw new ApiError(400, 'That fish is not in the species list yet')
  return api.post('/needs', { speciesId, kilos: i.kg, pricePerKg: i.maxPrice, neededBy: neededByFor(i.when), barangay: i.place })
}

export type MyNeed = {
  id: string
  buyerId: string
  kilos: number
  pricePerKg: number | null
  neededBy: string | null
  barangay: string
  createdAt: string
  status: string
  species: { englishName: string; localNames: string[] }
}

// The server's need, shaped like the Need the buyer screens already use, so those screens barely change
export const toNeed = (n: MyNeed): Need => ({
  id: n.id,
  buyerId: n.buyerId,
  place: n.barangay,
  species: fishName(n.species),
  kg: n.kilos,
  when: whenFrom(n.neededBy),
  maxPrice: n.pricePerKg ?? undefined,
  createdAt: Date.parse(n.createdAt),
  open: n.status === 'OPEN',
})

export function useMyNeeds() {
  const [needs, setNeeds] = useState<Need[]>([])
  const reload = useCallback(async () => {
    try { setNeeds((await api.get<MyNeed[]>('/needs/mine')).map(toNeed)) } catch { /* keep the old list */ }
  }, [])
  useEffect(() => { reload() }, [reload])
  return { needs, reload }
}

export const cancelNeed = (id: string) => api.patch(`/needs/${id}/cancel`)

/* ---------- fisherfolk: orders from accepted offers ---------- */

export type ApiOrder = {
  id: string
  catchId: string
  kilos: number
  pricePerKg: number
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  catch: { species: { englishName: string; localNames: string[] } }
  buyer: { id: string; name: string; businessName: string | null; barangay: string }
}

/* My orders as a seller. Asks again every 20 seconds. */
export function useMyOrders(everyMs = 20000) {
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const reload = useCallback(async () => {
    try { setOrders(await api.get<ApiOrder[]>('/orders/mine')) } catch { /* keep the old list */ }
  }, [])
  useEffect(() => {
    reload()
    const id = setInterval(() => { if (!document.hidden) reload() }, everyMs)
    return () => clearInterval(id)
  }, [reload, everyMs])
  return { orders, reload }
}