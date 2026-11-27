import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Droplet, Package, Plus, Receipt, Store, Tag, Waves, Wind } from 'lucide-react'
import PierScene from '../../components/buyer/PierScene'
import { answerOffer, useBuyerInbox } from '../../lib/buyerInbox'
import { openListings, riskOf, useMarket } from '../../lib/market'
import { useForecast } from '../../lib/weather'
import { localeOf } from '../../lib/time'
import { useUser } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { useT } from '../../lib/i18n'
import { useBT } from '../../lib/buyerText'
import wxDayImg from '../../assets/bg/buyer-weather-day.webp'
import wxNightImg from '../../assets/bg/buyer-weather-night.webp'
import { Badge, Panel } from '../admin/AdminBits'

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-US')}`
const RISK_TONE = { low: 'green', moderate: 'amber', high: 'red', critical: 'red' } as const
const quiet = 'rounded-lg border border-dashed border-line p-5 text-center text-sm text-ink-soft'

export default function BuyerHome() {
  const t = useT()
  const b = useBT()
  const user = useUser()
  const { lang, theme } = useSettings()
  const m = useMarket()
  const inbox = useBuyerInbox()
  const forecast = useForecast(user.barangay)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const lots = openListings(m).map((l) => ({ id: l.id, risk: riskOf(l, m.now) }))
  const waiting = inbox.offers.filter((o) => o.status === 'pending').sort((a, c) => c.createdAt - a.createdAt)
  const active = inbox.orders.filter((o) => o.status === 'confirmed' || o.status === 'onway').sort((a, c) => c.updatedAt - a.updatedAt)
  const needs = inbox.needs.filter((n) => n.open)
  const offersFor = (needId: string) => waiting.filter((o) => o.needId === needId).length

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const done = inbox.orders.filter((o) => o.status === 'received')
  const doneMonth = done.filter((o) => o.updatedAt >= monthStart)
  const spent = doneMonth.reduce((n, o) => n + o.price * o.kg, 0)
  const kgMonth = doneMonth.reduce((n, o) => n + o.kg, 0)

  const date = new Date().toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric' })
  const parts = [
    waiting.length > 0 && b('bh.status.offers', { n: waiting.length }),
    active.length > 0 && b('bh.status.orders', { n: active.length }),
  ].filter(Boolean)
  const status = !inbox.loaded ? b('bh.loading') : parts.length ? parts.join(' · ') : b('bh.caught')

  // the sea picture's boats and the weather card
  const open = openListings(m)
  const today = forecast.week[0]
  const now = forecast.now
  const temp = now?.temp ?? today.tMax
  const wind = now?.wind ?? today.wind
  const wave = now?.wave ?? today.wave
  const loading = forecast.status === 'loading'

  const seeAll = (to: string) => (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-teal transition hover:bg-seafoam/60">
      {b('c.seeall')} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  )

  const header = (
  <>
    <p className="pt-1 text-sm font-medium text-white break-words">{date}{user.barangay ? ` | ${user.barangay}` : ''}</p>
    <p className="mt-1 break-words font-numeral text-2xl font-bold leading-tight text-white sm:text-[28px]">{b('home.hello')}, {user.shortName}!</p>
    <p className="max-w-xs break-words text-sm font-semibold text-white/95">{status}</p>
  </>
)

  const answer = async (id: string, accept: boolean) => {
    setBusyId(id)
    setError('')
    try { await answerOffer(id, accept) } catch (e) { setError(e instanceof Error ? e.message : b('needs.err.answer')) } finally { setBusyId(null) }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {/* The harbor and the sea outside. The status line says what needs you today. */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <PierScene lots={open.map((l) => ({ id: l.id, risk: riskOf(l, m.now) }))} header={header} />
        <section
          aria-label={t('home.wx.title')}
          className="relative flex items-center justify-between gap-4 overflow-hidden rounded-lg bg-linear-to-b from-(--tide-sky-0) to-(--tide-sea-1) p-4 text-white shadow-raised lg:flex-col lg:items-stretch lg:p-5"
        >
          <img src={theme === 'night' ? wxNightImg : wxDayImg} alt="" className="absolute inset-0 size-full object-cover object-right" />
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/55" aria-hidden="true" />
          <div className="relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            <p className="font-numeral text-4xl font-bold leading-none lg:text-5xl">{loading ? '–' : temp}<span className="align-top text-xl lg:text-2xl">°C</span></p>
            <p className="mt-1 text-sm font-semibold">{t(`sky.${today.sky}`)}</p>
          </div>
          {/* phones: three icons with a number each. From lg: the labelled list. */}
          <ul className="relative z-10 flex gap-4 text-sm font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] lg:block lg:space-y-2 lg:font-medium">
            <li className="flex flex-col items-center gap-0.5 lg:flex-row lg:justify-between lg:gap-2">
              <span className="flex items-center gap-2"><Wind size={18} aria-hidden="true" /><span className="sr-only lg:not-sr-only">{t('home.wx.wind')}</span></span>
              <span>{loading ? '–' : `${wind} km/h`}</span>
            </li>
            <li className="flex flex-col items-center gap-0.5 lg:flex-row lg:justify-between lg:gap-2">
              <span className="flex items-center gap-2"><Waves size={18} aria-hidden="true" /><span className="sr-only lg:not-sr-only">{t('home.wx.waves')}</span></span>
              <span>{loading ? '–' : `${wave} m`}</span>
            </li>
            {now?.humidity !== undefined && (
              <li className="flex flex-col items-center gap-0.5 lg:flex-row lg:justify-between lg:gap-2">
                <span className="flex items-center gap-2"><Droplet size={18} aria-hidden="true" /><span className="sr-only lg:not-sr-only">{t('home.wx.humidity')}</span></span>
                <span>{now.humidity}%</span>
              </li>
            )}
          </ul>
        </section>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-start">
        <div className="min-w-0 space-y-5">
          <Panel icon={Tag} title={b('bh.offers.title')} sub={b('bh.offers.sub')} action={seeAll('/buyer/offers')}>
            {error && <p role="alert" className="mb-3 rounded-lg bg-risk-critical-bg px-4 py-3 text-sm font-semibold text-risk-critical">{error}</p>}
            {waiting.length === 0 ? (
              <p className={quiet}>{b('bh.offers.empty')}</p>
            ) : (
              <ul className="space-y-3">
                {waiting.slice(0, 4).map((o) => (
                  <li key={o.id} className="space-y-3 rounded-lg border border-line bg-mint p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-numeral text-lg font-bold leading-tight">{o.species} · {b('c.kg', { n: o.kg })}</p>
                        <p className="truncate text-sm text-ink-soft">{o.fisher}{o.place ? ` · ${o.place}` : ''}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-numeral text-lg font-bold leading-tight text-teal">{b('c.perkg', { n: o.price })}</p>
                        <p className="text-xs text-ink-soft">{b('c.total', { n: Math.round(o.price * o.kg).toLocaleString('en-US') })}</p>
                      </div>
                    </div>
                    {o.risk && o.risk in RISK_TONE && (
                      <div><Badge tone={RISK_TONE[o.risk as keyof typeof RISK_TONE]}>{b('needs.fresh', { r: t(`risk.${o.risk}` as 'risk.low') })}</Badge></div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, true)} className="min-h-11 rounded-full bg-teal px-4 text-sm font-bold text-on-accent transition active:scale-[0.98] disabled:opacity-60">{b('c.accept')}</button>
                      <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, false)} className="min-h-11 rounded-full border-2 border-line bg-card px-4 text-sm font-semibold transition hover:bg-seafoam/60 active:scale-[0.98] disabled:opacity-60">{b('c.decline')}</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {waiting.length > 4 && <p className="mt-3 text-center text-sm text-ink-soft">{b('bh.more', { n: waiting.length - 4 })}</p>}
          </Panel>

          <Panel icon={Package} title={b('home.orders')} action={seeAll('/buyer/orders')}>
            {active.length === 0 ? (
              <p className={quiet}>{b('bh.orders.empty')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {active.slice(0, 4).map((o) => (
                  <li key={o.id}>
                    <Link to="/buyer/orders" className="flex min-h-14 items-center gap-3 py-2.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><Package size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{o.species} · {b('c.kg', { n: o.kg })}</span>
                        <span className="block truncate text-xs text-ink-soft">{o.fisher}{o.place ? ` · ${o.place}` : ''}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-numeral text-base font-bold">{peso(o.price * o.kg)}</span>
                        <Badge tone="teal">{b('step.confirmed')}</Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel icon={ClipboardList} title={b('home.stat.needs')} action={seeAll('/buyer/needs')}>
            {needs.length === 0 ? (
              <div className={quiet}>
                <p>{b('bh.needs.empty')}</p>
                <Link to="/buyer/needs?new=1" className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-teal"><Plus size={16} strokeWidth={2.4} aria-hidden="true" />{b('home.needs.add')}</Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {needs.slice(0, 5).map((n) => {
                  const k = offersFor(n.id)
                  return (
                    <li key={n.id}>
                      <Link to="/buyer/needs" className="flex min-h-14 items-center gap-3 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{n.species} · {b('c.kg', { n: n.kg })}</span>
                          <span className="block truncate text-xs text-ink-soft">{b(`when.${n.when}` as 'when.today')}{n.maxPrice ? ` · ${b('needs.upto', { n: n.maxPrice })}` : ''}</span>
                        </span>
                        <span className="shrink-0"><Badge tone={k ? 'green' : 'slate'}>{k ? b('bh.offers.n', { n: k }) : b('bh.waiting')}</Badge></span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel icon={Receipt} title={b('bh.month')}>
            <dl className="grid grid-cols-3 gap-2 text-center sm:gap-3">
              {[
                { k: b('bh.spent'), v: peso(spent) },
                { k: b('bh.received'), v: `${Math.round(kgMonth * 10) / 10} kg` },
                { k: b('bh.donecount'), v: String(doneMonth.length) },
              ].map((s) => (
                <div key={s.k} className="min-w-0 rounded-lg bg-mint px-1.5 py-3">
                  <dd className="truncate font-numeral text-lg font-bold leading-tight tabular-nums sm:text-xl">{s.v}</dd>
                  <dt className="mt-0.5 text-xs font-semibold leading-tight text-ink-soft">{s.k}</dt>
                </div>
              ))}
            </dl>
            <Link to="/buyer/stall" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-teal text-sm font-semibold text-teal transition active:scale-[0.98]">
              <Store size={18} strokeWidth={1.8} aria-hidden="true" />{b('nav.stall')}
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  )
}