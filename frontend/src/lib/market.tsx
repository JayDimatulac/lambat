import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Catch } from '../data/mock'
import { riskFor } from './estimator'
import { BASE_PRICE } from './buyers'
import type { RiskLevel } from './risk'

// The meeting place between fisherfolk and buyers.
// DEMO ONLY: it lives in this browser (localStorage), so two tabs can act as two people.
// When the backend exists, each function below becomes a request and the screens do not change.
const HOUR = 3_600_000
const KEY = 'lambat.market.v1'

export type Listing = {
  id: string
  species: string
  kg: number
  place: string
  fisher: string
  postedAt: number
  deadline: number // the cautious end of the time left, as a clock time
  ask: number // pesos per kilo
  sample?: boolean
}
export type Need = { id: string; buyerId: string; buyer?: string; place?: string; species: string; kg: number; when: 'today' | 'tomorrow' | 'week'; maxPrice?: number; createdAt: number; open: boolean }
export type OrderStatus = 'offered' | 'declined' | 'confirmed' | 'onway' | 'received'
export type Order = {
  id: string; listingId: string; buyerId: string
  species: string; kg: number; place: string; fisher: string
  ask: number; price: number
  status: OrderStatus; rescue: boolean; createdAt: number; updatedAt: number
}
// A fisher's offer to answer a buyer's need
export type NeedOfferStatus = 'pending' | 'accepted' | 'declined'
export type NeedOffer = {
  id: string; needId: string
  fisherId: string; fisher: string
  catchId: string; species: string; kg: number; place: string
  price: number // pesos per kilo
  status: NeedOfferStatus; createdAt: number; updatedAt: number
}
type State = { listings: Listing[]; needs: Need[]; orders: Order[]; offers: NeedOffer[] }

// SAMPLE listings so a buyer always has something to see. Prices are sample prices, not research.
function seeds(now: number): State {
  const L = (id: string, species: string, kg: number, place: string, fisher: string, hoursLeft: number, ask: number): Listing =>
    ({ id, species, kg, place, fisher, postedAt: now - HOUR, deadline: now + hoursLeft * HOUR, ask, sample: true })
  return {
    listings: [
      L('x1', 'Tamban', 40, 'Calatagan', 'Ka Dado', 1.5, 70),
      L('x2', 'Hiwas', 12, 'Calatagan', 'Aling Mila', 3, 100),
      L('x3', 'Galunggong', 25, 'Balayan', 'Aling Nena', 5, 175),
      L('x4', 'Alumahan', 18, 'Lemery', 'Mang Jun', 11, 210),
      L('x5', 'Tambakol', 30, 'Balayan', 'Mang Berting', 20, 255),
    ],
    needs: [],
    orders: [],
    offers: [],
  }
}

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && Array.isArray(raw.listings) && Array.isArray(raw.needs) && Array.isArray(raw.orders)) {
      return { ...raw, offers: Array.isArray(raw.offers) ? raw.offers : [] } // older saves have no offers yet
    }
  } catch { /* fall through */ }
  return seeds(Date.now())
}

export const hoursLeft = (l: Listing, now = Date.now()) => Math.max(0, (l.deadline - now) / HOUR)
export const riskOf = (l: Listing, now = Date.now()): RiskLevel => riskFor(hoursLeft(l, now))
export const usualPrice = (species: string) => BASE_PRICE[species] ?? 100

type OfferInput = { fisherId: string; fisher: string; catchId: string; species: string; kg: number; place: string; price: number }

type Ctx = State & {
  now: number
  postListing: (c: Catch, fisher: string, fisherId: string) => void
  buy: (listingId: string, buyerId: string, price?: number) => void // no price = buy at the asking price
  advance: (orderId: string) => void
  addNeed: (n: Omit<Need, 'id' | 'createdAt' | 'open'>) => void
  closeNeed: (id: string) => void
  offerToNeed: (needId: string, o: OfferInput) => void // a fisher answers a need
  answerOffer: (offerId: string, accept: boolean) => void // the buyer accepts or declines
  resetMarket: () => void
}
const MarketCtx = createContext<Ctx | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage can be blocked */ }
  }, [state])
  // another tab changed the market (a fisher posted, a buyer bought): pick it up live
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setState(load()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // The fisher's reply, by a simple rule: an offer of 90% of the asking price or more is accepted. Demo only.
  useEffect(() => {
    const waiting = state.orders.filter((o) => o.status === 'offered' && now - o.createdAt > 5000)
    if (waiting.length === 0) return
    setState((s) => {
      const taken = new Set(s.orders.filter((o) => o.status !== 'offered' && o.status !== 'declined').map((o) => o.listingId))
      const orders = s.orders.map((o) => {
        if (o.status !== 'offered' || now - o.createdAt <= 5000) return o
        const yes = o.price >= o.ask * 0.9 && !taken.has(o.listingId)
        if (yes) taken.add(o.listingId)
        return { ...o, status: (yes ? 'confirmed' : 'declined') as OrderStatus, updatedAt: now }
      })
      return { ...s, orders }
    })
  }, [now, state.orders])

  const postListing = useCallback<Ctx['postListing']>((c, fisher, fisherId) => {
    const id = `${fisherId}:${c.id}`
    setState((s) => {
      if (s.listings.some((l) => l.id === id)) return s
      const l: Listing = { id, species: c.species, kg: c.kg, place: c.place, fisher, postedAt: Date.now(), deadline: Date.now() + c.minsMin * 60_000, ask: usualPrice(c.species) }
      return { ...s, listings: [l, ...s.listings] }
    })
  }, [])

  const buy = useCallback<Ctx['buy']>((listingId, buyerId, price) => {
    setState((s) => {
      const l = s.listings.find((x) => x.id === listingId)
      if (!l) return s
      if (s.orders.some((o) => o.listingId === listingId && o.status !== 'declined')) return s // already taken or being asked
      const at = Date.now()
      const sure = price === undefined || price >= l.ask
      const o: Order = {
        id: `o${at.toString(36)}`, listingId, buyerId, species: l.species, kg: l.kg, place: l.place, fisher: l.fisher,
        ask: l.ask, price: sure ? l.ask : price, status: sure ? 'confirmed' : 'offered',
        rescue: hoursLeft(l, at) <= 6, createdAt: at, updatedAt: at,
      }
      return { ...s, orders: [o, ...s.orders] }
    })
  }, [])

  const advance = useCallback((orderId: string) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id !== orderId ? o : o.status === 'confirmed' ? { ...o, status: 'onway', updatedAt: Date.now() } : o.status === 'onway' ? { ...o, status: 'received', updatedAt: Date.now() } : o)),
    }))
  }, [])

  const addNeed = useCallback<Ctx['addNeed']>((n) => {
    setState((s) => ({ ...s, needs: [{ ...n, id: `n${Date.now().toString(36)}`, createdAt: Date.now(), open: true }, ...s.needs] }))
  }, [])
  const closeNeed = useCallback((id: string) => setState((s) => ({ ...s, needs: s.needs.map((n) => (n.id === id ? { ...n, open: false } : n)) })), [])

  const offerToNeed = useCallback<Ctx['offerToNeed']>((needId, o) => {
    setState((s) => {
      const need = s.needs.find((n) => n.id === needId)
      if (!need || !need.open) return s
      // one live offer per fisher per need
      if (s.offers.some((x) => x.needId === needId && x.fisherId === o.fisherId && x.status !== 'declined')) return s
      const at = Date.now()
      const offer: NeedOffer = { ...o, id: `f${at.toString(36)}`, needId, status: 'pending', createdAt: at, updatedAt: at }
      return { ...s, offers: [offer, ...s.offers] }
    })
  }, [])

  const answerOffer = useCallback<Ctx['answerOffer']>((offerId, accept) => {
    setState((s) => {
      const offer = s.offers.find((x) => x.id === offerId)
      if (!offer || offer.status !== 'pending') return s
      const need = s.needs.find((n) => n.id === offer.needId)
      if (!need) return s
      const at = Date.now()
      if (!accept) {
        return { ...s, offers: s.offers.map((x) => (x.id === offerId ? { ...x, status: 'declined' as const, updatedAt: at } : x)) }
      }
      // accepting closes the need, declines the other waiting offers, and starts an order for the buyer
      const order: Order = {
        id: `o${at.toString(36)}`, listingId: `offer:${offer.id}`, buyerId: need.buyerId,
        species: offer.species, kg: offer.kg, place: offer.place, fisher: offer.fisher,
        ask: offer.price, price: offer.price, status: 'confirmed', rescue: false, createdAt: at, updatedAt: at,
      }
      return {
        ...s,
        needs: s.needs.map((n) => (n.id === need.id ? { ...n, open: false } : n)),
        offers: s.offers.map((x) => {
          if (x.id === offerId) return { ...x, status: 'accepted' as const, updatedAt: at }
          if (x.needId === need.id && x.status === 'pending') return { ...x, status: 'declined' as const, updatedAt: at }
          return x
        }),
        orders: [order, ...s.orders],
      }
    })
  }, [])

  const resetMarket = useCallback(() => setState(seeds(Date.now())), [])

  const value = useMemo(
    () => ({ ...state, now, postListing, buy, advance, addNeed, closeNeed, offerToNeed, answerOffer, resetMarket }),
    [state, now, postListing, buy, advance, addNeed, closeNeed, offerToNeed, answerOffer, resetMarket],
  )
  return <MarketCtx.Provider value={value}>{children}</MarketCtx.Provider>
}

export function useMarket() {
  const v = useContext(MarketCtx)
  if (!v) throw new Error('useMarket must be used inside <MarketProvider>')
  return v
}

// What a buyer is allowed to see: lots still on the clock and not already taken
export function openListings(m: Pick<Ctx, 'listings' | 'orders' | 'now'>) {
  const taken = new Set(m.orders.filter((o) => o.status !== 'declined').map((o) => o.listingId))
  return m.listings.filter((l) => l.deadline > m.now && !taken.has(l.id)).sort((a, b) => a.deadline - b.deadline)
}