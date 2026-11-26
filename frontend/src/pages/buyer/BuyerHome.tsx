import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ClipboardList, Clock, Fish, PackageCheck, Plus, Receipt, ShoppingBasket, Store, TrendingUp } from 'lucide-react'
import { useBuyerInbox } from '../../lib/buyerInbox'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import { Badge, Empty, Panel, Tile } from '../admin/AdminBits'
import { WaveLines } from '../admin/Charts'

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-US')}`
const shortId = (id: string) => `#ORD-${id.slice(-4).toUpperCase()}`
const WEEK = 7 * 24 * 60 * 60 * 1000
const WEEKS = 8

const action = 'flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border border-line p-4 text-center text-base font-semibold shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised active:scale-[0.98]'

export default function BuyerHome() {
  const { lang } = useSettings()
  const inbox = useBuyerInbox()

  const now = Date.now()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const activeOrders = inbox.orders.filter((o) => o.status === 'confirmed' || o.status === 'onway')
  const done = inbox.orders.filter((o) => o.status === 'received')
  const openNeeds = inbox.needs.filter((n) => n.open)
  const kgBought = done.reduce((n, o) => n + o.kg, 0)
  const spentThisMonth = done.filter((o) => o.updatedAt >= monthStart).reduce((n, o) => n + o.price * o.kg, 0)

  // kilos received per week, the last eight weeks (real completed orders only)
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const end = now - (WEEKS - 1 - i) * WEEK
    const start = end - WEEK
    const kg = done.filter((o) => o.updatedAt > start && o.updatedAt <= end).reduce((n, o) => n + o.kg, 0)
    return { label: new Date(end).toLocaleDateString(localeOf(lang), { month: 'short', day: 'numeric' }), values: [Math.round(kg * 10) / 10] }
  })
  const anyKg = weeks.some((w) => w.values[0] > 0)

  type Row = { id: string; at: number; icon: ReactNode; title: string; sub: string; pill: string; tone: 'teal' | 'green' | 'red' | 'slate'; to: string }
  const when = (t: number) => new Date(t).toLocaleString(localeOf(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const rows: Row[] = [
    ...inbox.orders.map((o): Row => {
      const finished = o.status === 'received'
      const cancelled = o.status === 'declined'
      return {
        id: `o-${o.id}`, at: o.updatedAt, to: '/buyer/orders',
        icon: finished ? <Check size={20} strokeWidth={1.8} aria-hidden="true" /> : <ShoppingBasket size={20} strokeWidth={1.8} aria-hidden="true" />,
        title: `Order ${shortId(o.id)} · ${o.species} · ${o.kg} kg`,
        sub: when(o.updatedAt),
        pill: finished ? 'Completed' : cancelled ? 'Cancelled' : 'Active',
        tone: finished ? 'green' : cancelled ? 'red' : 'teal',
      }
    }),
    ...inbox.needs.map((n): Row => ({
      id: `n-${n.id}`, at: n.createdAt, to: '/buyer/needs',
      icon: <Fish size={20} strokeWidth={1.8} aria-hidden="true" />,
      title: `Need request · ${n.species} · ${n.kg} kg`,
      sub: when(n.createdAt),
      pill: n.open ? 'Open' : 'Closed', tone: n.open ? 'teal' : 'slate',
    })),
  ].sort((a, b) => b.at - a.at).slice(0, 5)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile icon={ShoppingBasket} label="Active Orders" value={activeOrders.length} tone="blue" to="/buyer/orders" />
        <Tile icon={ClipboardList} label="Open Needs" value={openNeeds.length} tone="amber" to="/buyer/needs" />
        <Tile icon={Fish} label="Total Purchased" value={`${kgBought} kg`} tone="green" />
        <Tile icon={Receipt} label="Spent This Month" value={peso(spentThisMonth)} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel icon={TrendingUp} title="Weekly Purchases" sub="Kilos received, last 8 weeks">
          {anyKg ? (
            <WaveLines data={weeks} colors={['var(--color-teal)']} names={['Kilos received']} height={230} unit=" kg" />
          ) : (
            <Empty icon={TrendingUp} text="No completed orders yet. Your weekly kilos will show here." />
          )}
        </Panel>

        <Panel
          icon={Clock}
          title="Recent Activity"
          action={<Link to="/buyer/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-teal">See all <ArrowRight size={16} aria-hidden="true" /></Link>}
        >
          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-ink-soft">Nothing yet. Post a need or browse the pier to get started.</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link to={r.to} className="flex items-center gap-3 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal">{r.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.title}</span><span className="block text-xs text-ink-soft">{r.sub}</span></span>
                    <Badge tone={r.tone}>{r.pill}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel icon={Plus} title="Quick Actions">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link to="/buyer/pier" className={`${action} bg-seafoam text-teal`}><Fish size={30} strokeWidth={1.8} aria-hidden="true" />Browse Offers</Link>
          <Link to="/buyer/needs?new=1" className={`${action} bg-coral/20 text-deep`}><Plus size={30} strokeWidth={1.8} aria-hidden="true" />Post a Need</Link>
          <Link to="/buyer/orders" className={`${action} bg-seafoam text-teal`}><PackageCheck size={30} strokeWidth={1.8} aria-hidden="true" />Track Orders</Link>
          <Link to="/buyer/stall" className={`${action} bg-coral/20 text-deep`}><Store size={30} strokeWidth={1.8} aria-hidden="true" />Manage Stall</Link>
        </div>
      </Panel>
    </div>
  )
}