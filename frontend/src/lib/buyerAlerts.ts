import { useCallback } from 'react'
import { useUser } from './auth'
import { openListings, useMarket, type Listing, type Order } from './market'

// The buyer's alerts are worked out from the market, not stored: a lot that matches a need, and where each order stands.
// Only "when did I last look" is remembered, so we can say what is new.
export type Alert =
  | { id: string; kind: 'match'; at: number; listing: Listing }
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

  const needs = m.needs.filter((n) => n.buyerId === user.id && n.open)
  const matches: Alert[] = openListings(m)
    .filter((l) => needs.some((n) => n.species === l.species && (!n.maxPrice || l.ask <= n.maxPrice)))
    .map((l) => ({ id: `m:${l.id}`, kind: 'match', at: l.postedAt, listing: l }))
  const orders: Alert[] = m.orders
    .filter((o) => o.buyerId === user.id)
    .map((o) => ({ id: `o:${o.id}:${o.status}`, kind: 'order', at: o.updatedAt, order: o }))

  const alerts = [...matches, ...orders].sort((a, b) => b.at - a.at)
  return { alerts, unread: alerts.filter((a) => a.at > seenAt).length, seenAt, markSeen }
}