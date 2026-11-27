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
import { useBT, type BKey } from '../../lib/buyerText'
import wxDayImg from '../../assets/bg/buyer-weather-day.webp'
import wxNightImg from '../../assets/bg/buyer-weather-night.webp'

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-US')}`

/* One number and its label. Stacked on a phone so a long peso amount never gets squeezed. */
function StatTile({ icon, value, label, tone }: { icon: ReactNode; value: string | number; label: string; tone: string }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 rounded-lg border border-line bg-card/90 p-3 shadow-rest sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full sm:size-12 ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate font-numeral text-xl font-bold leading-none sm:text-2xl">{value}</p>
        <p className="mt-1 text-xs font-semibold leading-tight text-ink-soft">{label}</p>
      </div>
    </div>
  )
}

export default function BuyerHome() {
  const b = useBT()
  const t = useT()
  const { lang, theme } = useSettings()
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
  const when = (at: number) => new Date(at).toLocaleString(localeOf(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  type Row = { id: string; at: number; icon: ReactNode; title: string; sub: string; pill: BKey; pillCls: string; to: string }
  const rows: Row[] = [
    ...inbox.orders.map((o): Row => {
      const finished = o.status === 'received'
      const cancelled = o.status === 'declined'
      return {
        id: `o-${o.id}`, at: o.updatedAt, to: '/buyer/orders',
        icon: finished ? <Check size={20} aria-hidden="true" /> : <ShoppingBasket size={20} aria-hidden="true" />,
        title: `${o.species} · ${b('c.kg', { n: o.kg })}`,
        sub: `${b('home.row.order')} · ${when(o.updatedAt)}`,
        pill: finished ? 'c.done' : cancelled ? 'c.cancelled' : 'c.active',
        pillCls: finished ? 'bg-risk-low-bg text-risk-low' : cancelled ? 'bg-risk-critical-bg text-risk-critical' : 'bg-cream text-deep',
      }
    }),
    ...inbox.needs.map((n): Row => ({
      id: `n-${n.id}`, at: n.createdAt, to: '/buyer/needs',
      icon: <Fish size={20} aria-hidden="true" />,
      title: `${n.species} · ${b('c.kg', { n: n.kg })}`,
      sub: `${b('home.row.need')} · ${when(n.createdAt)}`,
      pill: n.open ? 'c.open' : 'c.closed', pillCls: n.open ? 'bg-seafoam text-teal' : 'bg-mint text-ink-soft',
    })),
  ].sort((a, c) => c.at - a.at).slice(0, 3)

  const today = forecast.week[0]
  const now = forecast.now
  const temp = now?.temp ?? today.tMax
  const wind = now?.wind ?? today.wind
  const wave = now?.wave ?? today.wave
  const loading = forecast.status === 'loading'

  const header = (
    <>
      <p className="truncate pt-1 text-sm font-medium text-white">{date}{user.barangay ? ` | ${user.barangay}` : ''}</p>
      <p className="mt-1 font-numeral text-2xl font-bold leading-tight text-white sm:text-[28px]">{b('home.hello')}, {user.shortName}!</p>
      <p className="max-w-xs text-sm text-white/90">{b('home.sub')}</p>
    </>
  )

  const action = 'flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-line p-3 text-center text-sm font-semibold shadow-rest transition active:scale-[0.98] sm:min-h-32 sm:gap-3 sm:p-4 sm:text-base'

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <PierScene lots={open.map((l) => ({ id: l.id, risk: riskOf(l, m.now) }))} header={header} />
        <section aria-label={t('home.wx.title')} className="relative flex items-center justify-between gap-4 overflow-hidden rounded-lg bg-gradient-to-b from-[var(--tide-sky-0)] to-[var(--tide-sea-1)] p-4 text-white shadow-raised lg:flex-col lg:items-stretch lg:p-5">
          <img src={theme === 'night' ? wxNightImg : wxDayImg} alt="" className="absolute inset-0 size-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/55" aria-hidden="true" />
          <div className="relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            <p className="font-numeral text-4xl font-bold leading-none lg:text-5xl">{loading ? '–' : temp}<span className="align-top text-xl lg:text-2xl">°C</span></p>
            <p className="mt-1 text-sm font-semibold">{t(`sky.${today.sky}`)}</p>
          </div>
          <ul className="relative z-10 space-y-1.5 text-sm font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] max-lg:min-w-[9rem] lg:space-y-2">
            <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><Wind size={16} aria-hidden="true" />{t('home.wx.wind')}</span><span>{loading ? '–' : `${wind} km/h`}</span></li>
            <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><Waves size={16} aria-hidden="true" />{t('home.wx.waves')}</span><span>{loading ? '–' : `${wave} m`}</span></li>
            {now?.humidity !== undefined && <li className="hidden items-center justify-between gap-3 lg:flex"><span className="flex items-center gap-2"><Droplet size={16} aria-hidden="true" />{t('home.wx.humidity')}</span><span>{now.humidity}%</span></li>}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<ShoppingBasket size={22} aria-hidden="true" />} value={activeOrders.length} label={b('home.stat.active')} tone="bg-seafoam text-teal" />
        <StatTile icon={<ClipboardList size={22} aria-hidden="true" />} value={openNeeds.length} label={b('home.stat.needs')} tone="bg-cream text-deep" />
        <StatTile icon={<Fish size={22} aria-hidden="true" />} value={`${kgBought} kg`} label={b('home.stat.kg')} tone="bg-seafoam text-teal" />
        <StatTile icon={<Receipt size={22} aria-hidden="true" />} value={peso(spentThisMonth)} label={b('home.stat.spent')} tone="bg-cream text-deep" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col rounded-lg border border-line bg-card/90 p-4 shadow-rest sm:p-5">
          <h2 className="mb-3 text-xl sm:mb-4 sm:text-2xl">{b('home.quick')}</h2>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Link to="/buyer/pier" className={`${action} bg-seafoam text-teal`}><Fish size={30} strokeWidth={1.8} aria-hidden="true" />{b('home.q.browse')}</Link>
            <Link to="/buyer/needs?new=1" className={`${action} bg-cream text-deep`}><Plus size={30} strokeWidth={1.8} aria-hidden="true" />{b('home.q.need')}</Link>
            <Link to="/buyer/orders" className={`${action} bg-seafoam text-teal`}><PackageCheck size={30} strokeWidth={1.8} aria-hidden="true" />{b('home.q.orders')}</Link>
            <Link to="/buyer/stall" className={`${action} bg-cream text-deep`}><Store size={30} strokeWidth={1.8} aria-hidden="true" />{b('home.q.stall')}</Link>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-card/90 p-4 shadow-rest">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl"><Clock size={22} strokeWidth={1.8} className="text-teal" aria-hidden="true" />{b('home.recent')}</h2>
            <Link to="/buyer/orders" className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-teal">{b('c.seeall')} <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-5 text-center text-sm text-ink-soft">{b('home.recent.empty')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link to={r.to} className="flex min-h-14 items-center gap-3 py-2.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal">{r.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.title}</span><span className="block truncate text-xs text-ink-soft">{r.sub}</span></span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${r.pillCls}`}>{b(r.pill)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}