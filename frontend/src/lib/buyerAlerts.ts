import { useCallback } from 'react'
import { useUser } from './auth'
import { openListings, useMarket, type Listing, type NeedOffer, type Order } from './market'

// The buyer's alerts are worked out from the market, not stored: a lot that matches a need, a fisher's offer, and where each order stands.
// Only "when did I last look" is remembered, so we can say what is new.
export type Alert =
  | { id: string; kind: 'match'; at: number; listing: Listing }
  | { id: string; kind: 'offer'; at: number; offer: NeedOffer }
  | { id: string; kind: 'order'; at: number; order: Order }

export function useBuyerAlerts() {
  const user = useUser()
  const m = useMarket()
  const key = `lambat.alerts.seen.${user.id}`

  let seenAt = 0
  try { seenAt = Number(localStorage.getItem(key)) || 0 } catch { /* storage can be blocked */ }
  const markSeen = useCallback(() => {
    try { localStorage.setItem(key, String(Date.now())) } catch { /* storage can be blocked */ }
  }, [key])

  const mineNeeds = m.needs.filter((n) => n.buyerId === user.id)
  const needs = mineNeeds.filter((n) => n.open)
  const matches: Alert[] = openListings(m)
    .filter((l) => needs.some((n) => n.species === l.species && (!n.maxPrice || l.ask <= n.maxPrice)))
    .map((l) => ({ id: `m:${l.id}`, kind: 'match', at: l.postedAt, listing: l }))
  const needIds = new Set(mineNeeds.map((n) => n.id))
  const offers: Alert[] = m.offers
    .filter((o) => needIds.has(o.needId) && o.status === 'pending')
    .map((o) => ({ id: `f:${o.id}`, kind: 'offer', at: o.createdAt, offer: o }))
  const orders: Alert[] = m.orders
    .filter((o) => o.buyerId === user.id)
    .map((o) => ({ id: `o:${o.id}:${o.status}`, kind: 'order', at: o.updatedAt, order: o }))

  const alerts = [...matches, ...offers, ...orders].sort((a, b) => b.at - a.at)
  return { alerts, unread: alerts.filter((a) => a.at > seenAt).length, seenAt, markSeen }
}