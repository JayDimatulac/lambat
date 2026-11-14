import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ClipboardList, Clock, Droplet, Fish, PackageCheck, Plus, Receipt, ShoppingBasket, Store, Waves, Wind } from 'lucide-react'
import PierScene from '../../components/buyer/PierScene'
import { useUser } from '../../lib/auth'
import { useBuyerInbox } from '../../lib/buyerInbox'
import { openListings, riskOf, useMarket } from '../../lib/market'
import { useForecast } from '../../lib/weather'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import { useT } from '../../lib/i18n'
import { useBT } from '../../lib/buyerText'

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-US')}`
const shortId = (id: string) => `#ORD-${id.slice(-4).toUpperCase()}`

function StatTile({ icon, value, label, tone }: { icon: ReactNode; value: string | number; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-card/90 p-4 shadow-rest">
      <span className={`grid size-12 shrink-0 place-items-center rounded-full ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="font-numeral text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs font-semibold text-ink-soft">{label}</p>
      </div>
    </div>
  )
}

export default function BuyerHome() {
  const b = useBT()
  const t = useT()
  const { lang } = useSettings()
  const user = useUser()
  const m = useMarket()
  const inbox = useBuyerInbox()
  const forecast = useForecast(user.barangay)

  const open = openListings(m)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const activeOrders = inbox.orders.filter((o) => o.status === 'confirmed' || o.status === 'onway')
  const done = inbox.orders.filter((o) => o.status === 'received')
  const openNeeds = inbox.needs.filter((n) => n.open)
  const kgBought = done.reduce((n, o) => n + o.kg, 0)
  const spentThisMonth = done.filter((o) => o.updatedAt >= monthStart).reduce((n, o) => n + o.price * o.kg, 0)

  const date = new Date().toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric' })

  type Row = { id: string; at: number; icon: ReactNode; title: string; sub: string; pill: string; pillCls: string; to: string }
  const rows: Row[] = [
    ...inbox.orders.map((o): Row => {
      const finished = o.status === 'received'
      const cancelled = o.status === 'declined'
      return {
        id: `o-${o.id}`, at: o.updatedAt, to: '/buyer/orders',
        icon: finished ? <Check size={20} aria-hidden="true" /> : <ShoppingBasket size={20} aria-hidden="true" />,
        title: `Order ${shortId(o.id)} · ${o.species} · ${o.kg} kg`,
        sub: new Date(o.updatedAt).toLocaleString(localeOf(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        pill: finished ? 'Completed' : cancelled ? 'Cancelled' : 'Active',
        pillCls: finished ? 'bg-risk-low-bg text-risk-low' : cancelled ? 'bg-risk-critical-bg text-risk-critical' : 'bg-cream text-deep',
      }
    }),
    ...inbox.needs.map((n): Row => ({
      id: `n-${n.id}`, at: n.createdAt, to: '/buyer/needs',
      icon: <Fish size={20} aria-hidden="true" />,
      title: `Need request · ${n.species} · ${n.kg} kg`,
      sub: new Date(n.createdAt).toLocaleString(localeOf(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      pill: n.open ? 'Open' : 'Closed', pillCls: n.open ? 'bg-seafoam text-teal' : 'bg-mint text-ink-soft',
    })),
  ].sort((a, b2) => b2.at - a.at).slice(0, 3)

  const today = forecast.week[0]
  const now = forecast.now
  const temp = now?.temp ?? today.tMax
  const wind = now?.wind ?? today.wind
  const wave = now?.wave ?? today.wave
  const loading = forecast.status === 'loading'

  const header = (
    <>
      <p className="pt-1 text-sm font-medium text-white">{date}{user.barangay ? ` | ${user.barangay}` : ''}</p>
      <p className="mt-1 font-numeral text-[28px] font-bold leading-tight text-white">{b('home.hello')}, {user.shortName}!</p>
      <p className="max-w-xs text-sm text-white/90">{b('home.sub')}</p>
    </>
  )

  const action = 'flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-line p-3 text-center text-sm font-semibold shadow-rest transition active:scale-[0.98]'

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <PierScene lots={open.map((l) => ({ id: l.id, risk: riskOf(l, m.now) }))} header={header} />
        <section aria-label={t('home.wx.title')} className="flex flex-col justify-between gap-4 rounded-lg bg-gradient-to-b from-[var(--tide-sky-0)] to-[var(--tide-sea-1)] p-5 text-white shadow-raised">
          <div>
            <p className="font-numeral text-5xl font-bold leading-none">{loading ? '–' : temp}<span className="align-top text-2xl">°C</span></p>
            <p className="mt-1 text-sm font-semibold">{t(`sky.${today.sky}`)}</p>
          </div>
          <ul className="space-y-2 text-sm font-medium">
            <li className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Wind size={16} aria-hidden="true" />{t('home.wx.wind')}</span><span>{loading ? '–' : `${wind} km/h`}</span></li>
            <li className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Waves size={16} aria-hidden="true" />{t('home.wx.waves')}</span><span>{loading ? '–' : `${wave} m`}</span></li>
            {now?.humidity !== undefined && <li className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Droplet size={16} aria-hidden="true" />{t('home.wx.humidity')}</span><span>{now.humidity}%</span></li>}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<ShoppingBasket size={24} aria-hidden="true" />} value={activeOrders.length} label="Active Orders" tone="bg-seafoam text-teal" />
        <StatTile icon={<ClipboardList size={24} aria-hidden="true" />} value={openNeeds.length} label="Open Needs" tone="bg-cream text-deep" />
        <StatTile icon={<Fish size={24} aria-hidden="true" />} value={`${kgBought} kg`} label="Total Purchased" tone="bg-seafoam text-teal" />
        <StatTile icon={<Receipt size={24} aria-hidden="true" />} value={peso(spentThisMonth)} label="Total Spent This Month" tone="bg-cream text-deep" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line bg-card/90 p-4 shadow-rest">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl"><Clock size={22} strokeWidth={1.8} className="text-teal" aria-hidden="true" />Recent Activity</h2>
            <Link to="/buyer/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-teal">See All <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-ink-soft">Nothing yet. Post a need or browse the pier to get started.</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link to={r.to} className="flex items-center gap-3 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal">{r.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.title}</span><span className="block text-xs text-ink-soft">{r.sub}</span></span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${r.pillCls}`}>{r.pill}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-line bg-card/90 p-4 shadow-rest">
          <h2 className="mb-3 text-xl">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/buyer/pier" className={`${action} bg-seafoam text-teal`}><Fish size={26} strokeWidth={1.8} aria-hidden="true" />Browse Offers</Link>
            <Link to="/buyer/needs?new=1" className={`${action} bg-cream text-deep`}><Plus size={26} strokeWidth={1.8} aria-hidden="true" />Post a Need</Link>
            <Link to="/buyer/orders" className={`${action} bg-seafoam text-teal`}><PackageCheck size={26} strokeWidth={1.8} aria-hidden="true" />Track Orders</Link>
            <Link to="/buyer/stall" className={`${action} bg-cream text-deep`}><Store size={26} strokeWidth={1.8} aria-hidden="true" />Manage Stall</Link>
          </div>
        </section>
      </div>
    </div>
  )
}