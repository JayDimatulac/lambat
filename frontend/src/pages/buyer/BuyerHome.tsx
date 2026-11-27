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
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const RISK_TONE = { low: 'green', moderate: 'amber', high: 'red', critical: 'red' } as const

const seeAll = (to: string) => (
  <Link to={to} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-teal transition hover:bg-seafoam/60">
    See all <ArrowRight size={16} aria-hidden="true" />
  </Link>
)
const quiet = 'rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-soft'

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

  const waiting = inbox.offers.filter((o) => o.status === 'pending').sort((a, c) => c.createdAt - a.createdAt)
  const active = inbox.orders.filter((o) => o.status === 'confirmed' || o.status === 'onway').sort((a, c) => c.updatedAt - a.updatedAt)
  const needs = inbox.needs.filter((n) => n.open)
  const offersFor = (needId: string) => waiting.filter((o) => o.needId === needId).length

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const done = inbox.orders.filter((o) => o.status === 'received')
  const doneMonth = done.filter((o) => o.updatedAt >= monthStart)
  const spent = doneMonth.reduce((n, o) => n + o.price * o.kg, 0)
  const kgMonth = doneMonth.reduce((n, o) => n + o.kg, 0)
  const kgAll = done.reduce((n, o) => n + o.kg, 0)

  const date = new Date().toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric' })
  const parts = [waiting.length && `${plural(waiting.length, 'offer', 'offers')} waiting for your answer`, active.length && `${plural(active.length, 'order', 'orders')} confirmed`].filter(Boolean)
  const status = !inbox.loaded ? 'Loading your activity…' : parts.length ? parts.join(' · ') : "You're all caught up."

  // the sea picture's boats and the weather card
  const open = openListings(m)
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
      <p className="max-w-xs text-sm font-semibold text-white/95">{status}</p>
    </>
  )

  const answer = async (id: string, accept: boolean) => {
    setBusyId(id)
    setError('')
    try { await answerOffer(id, accept) } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Try again.') } finally { setBusyId(null) }
  }

  return (
    <div className="space-y-5">
      {/* The harbor and the sea outside, as before. The status line says what needs you today. */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-4">
          <Panel icon={Tag} title="Offers to answer" sub="Fisherfolk replying to your needs" action={seeAll('/buyer/offers')}>
            {error && <p role="alert" className="mb-3 rounded-lg bg-risk-critical-bg px-4 py-3 text-sm font-semibold text-risk-critical">{error}</p>}
            {waiting.length === 0 ? (
              <p className={quiet}>No offers waiting. When a fisher answers one of your needs, it shows up here.</p>
            ) : (
              <ul className="space-y-3">
                {waiting.slice(0, 4).map((o) => (
                  <li key={o.id} className="rounded-lg border border-line bg-mint p-4">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="font-numeral text-lg font-bold leading-tight">{o.species} · {o.kg} kg</p>
                        <p className="truncate text-sm text-ink-soft">{o.fisher}{o.place ? ` · ${o.place}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-numeral text-lg font-bold text-teal">₱{o.price}/kg</p>
                        <p className="text-xs text-ink-soft">Total {peso(o.price * o.kg)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      {o.risk && o.risk in RISK_TONE ? <Badge tone={RISK_TONE[o.risk as keyof typeof RISK_TONE]}>Spoilage risk: {t(`risk.${o.risk}` as 'risk.low')}</Badge> : <span />}
                      <span className="flex gap-2">
                        <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, true)} className="min-h-11 rounded-full bg-teal px-5 text-sm font-bold text-on-accent transition active:scale-[0.98] disabled:opacity-60">Accept</button>
                        <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, false)} className="min-h-11 rounded-full border-2 border-line px-5 text-sm font-semibold transition hover:bg-seafoam/60 active:scale-[0.98] disabled:opacity-60">Decline</button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {waiting.length > 4 && <p className="mt-3 text-center text-sm text-ink-soft">and {waiting.length - 4} more in Offers</p>}
          </Panel>

          <Panel icon={Package} title="On order" sub="Confirmed, waiting to be done" action={seeAll('/buyer/orders')}>
            {active.length === 0 ? (
              <p className={quiet}>No orders in progress. Accepting an offer starts one.</p>
            ) : (
              <ul className="divide-y divide-line">
                {active.slice(0, 4).map((o) => (
                  <li key={o.id}>
                    <Link to="/buyer/orders" className="flex items-center gap-3 py-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><Package size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{o.species} · {o.kg} kg</span>
                        <span className="block truncate text-xs text-ink-soft">{o.fisher}{o.place ? ` · ${o.place}` : ''}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-numeral text-base font-bold">{peso(o.price * o.kg)}</span>
                        <Badge tone="teal">Confirmed</Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {active.length > 0 && <p className="mt-2 text-xs text-ink-soft">The fisher marks an order done once you have received the fish.</p>}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel icon={ClipboardList} title="Your open needs" action={seeAll('/buyer/needs')}>
            {needs.length === 0 ? (
              <div className={quiet}>
                <p>Nothing posted. Tell fisherfolk what fish you are looking for.</p>
                <Link to="/buyer/needs?new=1" className="mt-3 inline-flex min-h-10 items-center gap-1.5 font-semibold text-teal"><Plus size={16} strokeWidth={2.4} aria-hidden="true" />Post a need</Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {needs.slice(0, 5).map((n) => {
                  const k = offersFor(n.id)
                  return (
                    <li key={n.id}>
                      <Link to="/buyer/needs" className="flex items-center gap-3 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{n.species} · {n.kg} kg</span>
                          <span className="block truncate text-xs text-ink-soft">{b(`when.${n.when}` as 'when.today')}{n.maxPrice ? ` · up to ₱${n.maxPrice}/kg` : ''}</span>
                        </span>
                        <Badge tone={k ? 'green' : 'slate'}>{k ? plural(k, 'offer', 'offers') : 'Waiting'}</Badge>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel icon={Receipt} title="This month">
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                { k: 'Spent', v: peso(spent) },
                { k: 'Received', v: `${Math.round(kgMonth * 10) / 10} kg` },
                { k: 'Orders done', v: String(doneMonth.length) },
              ].map((s) => (
                <div key={s.k} className="rounded-lg bg-mint px-2 py-3">
                  <dd className="font-numeral text-xl font-bold leading-tight tabular-nums">{s.v}</dd>
                  <dt className="mt-0.5 text-xs font-semibold text-ink-soft">{s.k}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-ink-soft">All time: {Math.round(kgAll * 10) / 10} kg in {plural(done.length, 'order', 'orders')}</span>
              <Link to="/buyer/stall" className="inline-flex items-center gap-1.5 font-semibold text-teal"><Store size={16} strokeWidth={1.8} aria-hidden="true" />Your stall</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}