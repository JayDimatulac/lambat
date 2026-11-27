import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import RopeTimeline from '../../components/buyer/RopeTimeline'
import FishPhoto from '../../components/buyer/FishPhoto'
import TabBar from '../../components/buyer/TabBar'
import { useBuyerInbox } from '../../lib/buyerInbox'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import type { Order } from '../../lib/market'
import { useBT, type BKey } from '../../lib/buyerText'

type Tab = 'all' | 'active' | 'done' | 'cancelled'
const TABS: { id: Tab; label: BKey }[] = [
  { id: 'all', label: 'c.all' },
  { id: 'active', label: 'c.active' },
  { id: 'done', label: 'c.done' },
  { id: 'cancelled', label: 'c.cancelled' },
]

type Status = Exclude<Tab, 'all'>
const tabOf = (o: Order): Status => (o.status === 'received' ? 'done' : o.status === 'declined' ? 'cancelled' : 'active')
const PILL: Record<Status, { label: BKey; cls: string }> = {
  active: { label: 'c.active', cls: 'bg-cream text-deep' },
  done: { label: 'c.done', cls: 'bg-risk-low-bg text-risk-low' },
  cancelled: { label: 'c.cancelled', cls: 'bg-risk-critical-bg text-risk-critical' },
}

export default function BuyerOrders() {
  const b = useBT()
  const { lang } = useSettings()
  const { orders } = useBuyerInbox()
  const [tab, setTab] = useState<Tab>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const count = (t: Tab) => (t === 'all' ? orders.length : orders.filter((o) => tabOf(o) === t).length)
  const list = [...orders].filter((o) => tab === 'all' || tabOf(o) === tab).sort((a, c) => c.updatedAt - a.updatedAt)
  const when = (at: number) => new Date(at).toLocaleString(localeOf(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-[28px]">{b('orders.title')}</h1>
        <p className="text-sm text-ink-soft">{b('orders.sub')}</p>
      </div>

      <TabBar
        label={b('orders.title')}
        value={tab}
        onChange={setTab}
        tabs={TABS.map((x) => ({ id: x.id, label: b(x.label), count: count(x.id) }))}
      />

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-6 text-center text-sm text-ink-soft">{b('orders.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const pill = PILL[tabOf(o)]
            const expanded = openId === o.id
            const total = (o.price * o.kg).toLocaleString('en-US')
            return (
              <li key={o.id} className="overflow-hidden rounded-lg border border-line bg-card/90 shadow-rest">
                <button type="button" onClick={() => setOpenId(expanded ? null : o.id)} aria-expanded={expanded} className="flex w-full items-center gap-3 p-3 text-left sm:gap-4">
                  <FishPhoto species={o.species} className="size-14 shrink-0 rounded-md sm:size-16" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-numeral text-base font-bold leading-tight">{o.species} · {b('c.kg', { n: o.kg })}</span>
                    <span className="block truncate text-sm text-ink-soft">{b('c.from', { name: o.fisher })}</span>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold sm:hidden ${pill.cls}`}>{b(pill.label)}</span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block font-numeral text-lg font-bold text-teal">₱{total}</span>
                    <span className="block text-xs text-ink-soft">{when(o.updatedAt)}</span>
                  </span>
                  <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex ${pill.cls}`}>{b(pill.label)}</span>
                  <span className="shrink-0 text-right sm:hidden">
                    <span className="block font-numeral text-base font-bold text-teal">₱{total}</span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className={`shrink-0 text-ink-soft transition ${expanded ? 'rotate-90' : ''}`} />
                </button>
                {expanded && (
                  <div className="space-y-3 border-t border-line p-4">
                    <p className="text-sm text-ink-soft">{b('c.perkg', { n: o.price })} · {o.place} · {when(o.updatedAt)}</p>
                    {(o.status === 'confirmed' || o.status === 'onway' || o.status === 'received') && <RopeTimeline status={o.status} />}
                    {o.status === 'confirmed' && (
                      <p className="rounded-md bg-seafoam p-3 text-sm font-semibold text-teal">{b('order.confirmed.note', { fisher: o.fisher })}</p>
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