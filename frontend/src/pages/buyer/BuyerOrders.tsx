import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import RopeTimeline from '../../components/buyer/RopeTimeline'
import FishPhoto from '../../components/buyer/FishPhoto'
import { useBuyerInbox } from '../../lib/buyerInbox'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import type { Order } from '../../lib/market'
import { useBT } from '../../lib/buyerText'

type Tab = 'all' | 'active' | 'done' | 'cancelled'
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

const tabOf = (o: Order): Tab => (o.status === 'received' ? 'done' : o.status === 'declined' ? 'cancelled' : 'active')
const PILL: Record<Tab, { text: string; cls: string }> = {
  all: { text: '', cls: '' },
  active: { text: 'Active', cls: 'bg-cream text-deep' },
  done: { text: 'Completed', cls: 'bg-risk-low-bg text-risk-low' },
  cancelled: { text: 'Cancelled', cls: 'bg-risk-critical-bg text-risk-critical' },
}

export default function BuyerOrders() {
  const b = useBT()
  const { lang } = useSettings()
  const { orders } = useBuyerInbox()
  const [tab, setTab] = useState<Tab>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const count = (t: Tab) => (t === 'all' ? orders.length : orders.filter((o) => tabOf(o) === t).length)
  const list = [...orders].filter((o) => tab === 'all' || tabOf(o) === tab).sort((a, c) => c.updatedAt - a.updatedAt)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px]">{b('orders.title')}</h1>
        <p className="text-sm text-ink-soft">Track and manage your purchases</p>
      </div>

      <div role="tablist" aria-label={b('orders.title')} className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${tab === x.id ? 'border-teal bg-teal text-on-accent' : 'border-line bg-card/80 text-navy hover:bg-seafoam'}`}>
            {x.label} ({count(x.id)})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{b('orders.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const pill = PILL[tabOf(o)]
            const expanded = openId === o.id
            return (
              <li key={o.id} className="overflow-hidden rounded-lg border border-line bg-card/90 shadow-rest">
                <button type="button" onClick={() => setOpenId(expanded ? null : o.id)} aria-expanded={expanded} className="flex w-full items-center gap-3 p-3 text-left sm:gap-4">
                  <FishPhoto species={o.species} className="size-16 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-numeral text-base font-bold leading-tight">Order #ORD-{o.id.slice(-4).toUpperCase()}</span>
                    <span className="block text-sm">{o.species} · {o.kg} kg</span>
                    <span className="block truncate text-xs text-ink-soft">From: {o.fisher}</span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block font-numeral text-lg font-bold text-teal">₱{(o.price * o.kg).toLocaleString('en-US')}</span>
                    <span className="block text-xs text-ink-soft">{new Date(o.updatedAt).toLocaleString(localeOf(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${pill.cls}`}>{pill.text}</span>
                  <ChevronRight size={18} aria-hidden="true" className={`shrink-0 text-ink-soft transition ${expanded ? 'rotate-90' : ''}`} />
                </button>
                {expanded && (
                  <div className="space-y-3 border-t border-line p-4">
                    <p className="text-sm sm:hidden"><b>₱{(o.price * o.kg).toLocaleString('en-US')}</b> · ₱{o.price}/kg</p>
                    <p className="hidden text-sm text-ink-soft sm:block">₱{o.price}/kg · {o.place}</p>
                    {(o.status === 'confirmed' || o.status === 'onway' || o.status === 'received') && <RopeTimeline status={o.status} />}
                    {o.status === 'confirmed' && (
                      <p className="rounded-md bg-seafoam p-3 text-sm font-semibold text-teal">Confirmed. {o.fisher} will mark this order done when you have received the fish.</p>
                    )}
                    {o.status === 'declined' && <p className="rounded-md bg-risk-critical-bg p-3 text-sm font-semibold text-risk-critical">{b('order.declined')}</p>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}