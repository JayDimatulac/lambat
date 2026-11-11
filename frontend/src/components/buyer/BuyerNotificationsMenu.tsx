import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, CheckCircle2, Fish, Hourglass, PackageCheck, Tag, Truck, XCircle } from 'lucide-react'
import { useUser } from '../../lib/auth'
import { useBuyerAlerts, type Alert } from '../../lib/buyerAlerts'
import { useBT, type BKey } from '../../lib/buyerText'
import { useT } from '../../lib/i18n'
import { useMarket, type OrderStatus } from '../../lib/market'

const ORDER_TEXT: Record<OrderStatus, BKey> = {
  offered: 'order.waiting', declined: 'order.declined', confirmed: 'alert.o.confirmed', onway: 'alert.o.onway', received: 'alert.o.received',
}
const GOOD = 'bg-risk-low-bg text-risk-low'
const ICON: Record<OrderStatus | 'match' | 'offer', { icon: typeof Fish; cls: string }> = {
  match: { icon: Fish, cls: 'bg-seafoam text-teal' },
  offer: { icon: Tag, cls: 'bg-risk-moderate-bg text-risk-moderate' },
  offered: { icon: Hourglass, cls: 'bg-risk-moderate-bg text-risk-moderate' },
  declined: { icon: XCircle, cls: 'bg-risk-critical-bg text-risk-critical' },
  confirmed: { icon: CheckCircle2, cls: GOOD },
  onway: { icon: Truck, cls: GOOD },
  received: { icon: PackageCheck, cls: GOOD },
}

const readKey = (userId: string) => `lambat.notif.read.buyer.${userId}`
const loadRead = (userId: string): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(readKey(userId)) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const saveRead = (userId: string, ids: string[]) => {
  try { localStorage.setItem(readKey(userId), JSON.stringify(ids.slice(-200))) } catch { /* storage can be blocked */ }
}

/* The buyer's bell. It opens a small panel with the lots that match a need, the offers fisherfolk send, and the news about your orders.
   It is not a page: tap an alert to go to what it is about. */
export default function BuyerNotificationsMenu() {
  const b = useBT()
  const t = useT()
  const user = useUser()
  const { now } = useMarket()
  const { alerts } = useBuyerAlerts()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<string[]>(() => loadRead(user.id))
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = alerts.filter((a) => !read.includes(a.id)).length
  const markRead = (ids: string[]) => {
    const next = [...new Set([...read, ...ids])]
    setRead(next)
    saveRead(user.id, next)
  }

  const ago = (at: number) => {
    const min = Math.max(0, Math.floor((now - at) / 60000))
    return min < 1 ? b('ago.now') : min < 60 ? b('ago.min', { n: min }) : b('ago.hr', { n: Math.floor(min / 60) })
  }
  const view = (a: Alert) => {
    if (a.kind === 'match') {
      return {
        to: '/buyer/offers',
        tone: ICON.match,
        title: `${a.listing.species} · ${a.listing.kg} kg`,
        body: `${b('alert.match')}. ${b('alert.match.body', { fisher: a.listing.fisher, place: a.listing.place, ask: a.listing.ask })}`,
      }
    }
    if (a.kind === 'offer') {
      return {
        to: '/buyer/needs',
        tone: ICON.offer,
        title: `${a.offer.species} · ${a.offer.kg} kg`,
        body: `${a.offer.fisher} offers ₱${a.offer.price}/kg · ${a.offer.place}`,
      }
    }
    return {
      to: '/buyer/orders',
      tone: ICON[a.order.status],
      title: `${a.order.species} · ${a.order.kg} kg`,
      body: `${b(ORDER_TEXT[a.order.status])} ${a.order.fisher} · ${a.order.place}`,
    }
  }

  return (
    <div ref={box} className="sm:relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `${b('nav.alerts')}: ${t('notif.new', { n: unread })}` : b('nav.alerts')}
        onClick={() => setOpen(!open)}
        className="relative grid size-11 place-items-center rounded-full transition hover:bg-seafoam"
      >
        <Bell size={22} strokeWidth={1.8} aria-hidden className={unread ? 'anim-ring' : ''} />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-coral px-1 text-xs font-bold leading-5 text-deep ring-2 ring-card">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label={b('nav.alerts')} className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-card shadow-raised sm:inset-x-auto sm:right-0 sm:w-96">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="font-numeral text-lg font-bold">{b('nav.alerts')}</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead(alerts.map((a) => a.id))}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-teal transition hover:bg-seafoam"
              >
                <CheckCheck size={16} strokeWidth={1.8} aria-hidden />
                {t('notif.markall')}
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-seafoam text-teal">
                <Bell size={22} strokeWidth={1.8} aria-hidden />
              </span>
              <p className="mt-3 text-sm text-ink-soft">{b('alerts.empty')}</p>
            </div>
          ) : (
            <ul className="max-h-[60dvh] divide-y divide-line overflow-y-auto">
              {alerts.slice(0, 30).map((a) => {
                const v = view(a)
                const isNew = !read.includes(a.id)
                return (
                  <li key={a.id}>
                    <Link
                      to={v.to}
                      onClick={() => { markRead([a.id]); setOpen(false) }}
                      className={`flex items-start gap-3 px-4 py-3 transition hover:bg-seafoam/60 ${isNew ? '' : 'opacity-60'}`}
                    >
                      <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${v.tone.cls}`}>
                        <v.tone.icon size={20} strokeWidth={1.8} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-tight">{v.title}</span>
                        <span className="mt-0.5 block text-sm text-ink-soft">{v.body}</span>
                        <span className="mt-1 block text-xs font-semibold text-ink-soft">{ago(a.at)}</span>
                      </span>
                      {isNew && <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-coral" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}