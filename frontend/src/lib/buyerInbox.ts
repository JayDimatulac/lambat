import { useEffect, useSyncExternalStore } from 'react'
import { api } from './api'
import type { Need, NeedOffer, Order } from './market'
import { fishName, toNeed, type MyNeed } from './marketApi'

// The buyer's side of the meeting place, straight from the server: my needs, the offers fisherfolk sent me, and my orders.
// One shared loop asks every 15 seconds, so the home page, the bell, the badge and the pages all see the same news.

type RawOffer = {
  id: string
  needId: string | null
  catchId: string
  kilos: number
  pricePerKg: number
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'WITHDRAWN'
  createdAt: string
  respondedAt: string | null
  fisher: { id: string; name: string; barangay: string }
  catch: { place: string | null; species: { englishName: string; localNames: string[] }; assessment: { risk: string | null } | null }
}

type RawOrder = {
  id: string
  offerId: string
  buyerId: string
  kilos: number
  pricePerKg: number
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  completedAt: string | null
  catch: { species: { englishName: string; localNames: string[] } }
  fisher: { id: string; name: string; barangay: string }
}

/* An offer shaped like the screens already expect, plus how fresh the catch looks (the server works that out) */
export type InboxOffer = NeedOffer & { risk: string | null }

type Snap = { needs: Need[]; offers: InboxOffer[]; orders: Order[]; loaded: boolean }
const EMPTY: Snap = { needs: [], offers: [], orders: [], loaded: false }

const OFFER_STATUS = { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined' } as const
const ORDER_STATUS = { CONFIRMED: 'confirmed', COMPLETED: 'received', CANCELLED: 'declined' } as const

const toOffer = (o: RawOffer): InboxOffer | null => {
  const status = OFFER_STATUS[o.status as keyof typeof OFFER_STATUS]
  if (!status) return null // withdrawn or expired offers are not shown
  return {
    id: o.id,
    needId: o.needId ?? '',
    fisherId: o.fisher.id,
    fisher: o.fisher.name,
    catchId: o.catchId,
    species: fishName(o.catch.species),
    kg: o.kilos,
    place: o.catch.place || o.fisher.barangay,
    price: o.pricePerKg,
    status,
    createdAt: Date.parse(o.createdAt),
    updatedAt: Date.parse(o.respondedAt ?? o.createdAt),
    risk: o.catch.assessment?.risk ?? null,
  }
}

const toOrder = (o: RawOrder): Order => ({
  id: o.id,
  listingId: o.offerId,
  buyerId: o.buyerId,
  species: fishName(o.catch.species),
  kg: o.kilos,
  place: o.fisher.barangay,
  fisher: o.fisher.name,
  ask: o.pricePerKg,
  price: o.pricePerKg,
  status: ORDER_STATUS[o.status],
  rescue: false,
  createdAt: Date.parse(o.createdAt),
  updatedAt: Date.parse(o.completedAt ?? o.createdAt),
})

let snap: Snap = EMPTY
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

let busy = false
let again = false
export async function refreshInbox(): Promise<void> {
  if (busy) { again = true; return } // a request is running: ask once more when it ends
  busy = true
  try {
    const [needs, offers, orders] = await Promise.all([
      api.get<MyNeed[]>('/needs/mine'),
      api.get<RawOffer[]>('/offers/mine'),
      api.get<RawOrder[]>('/orders/mine'),
    ])
    snap = {
      needs: needs.map(toNeed),
      offers: offers.map(toOffer).filter((o): o is InboxOffer => o !== null),
      orders: orders.map(toOrder),
      loaded: true,
    }
    emit()
  } catch {
    // keep what is on screen; a real 401 logs the person out through api.ts
  } finally {
    busy = false
    if (again) { again = false; void refreshInbox() }
  }
}

/* The buyer says yes or no to a fisherfolk's offer. Yes makes the order. The lists refresh either way. */
export async function answerOffer(id: string, accept: boolean) {
  try {
    await api.patch(`/offers/${id}/${accept ? 'accept' : 'decline'}`)
  } finally {
    await refreshInbox()
  }
}

let users = 0
let timer: ReturnType<typeof setInterval> | undefined
export function useBuyerInbox(): Snap {
  const s = useSyncExternalStore(subscribe, () => snap)
  useEffect(() => {
    users++
    if (users === 1) {
      void refreshInbox()
      timer = setInterval(() => { if (!document.hidden) void refreshInbox() }, 15000)
      window.addEventListener('focus', refreshInbox)
    }
    return () => {
      users--
      if (users === 0) {
        clearInterval(timer)
        window.removeEventListener('focus', refreshInbox)
        snap = EMPTY // the next person to log in starts clean
      }
    }
  }, [])
  return s
}