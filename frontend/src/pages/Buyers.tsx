import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import NeedRadar, { type Blip } from '../components/buyer/NeedRadar'
import OrdersToFinish from '../components/buyer/OrdersToFinish'
import Radar from '../components/buyer/Radar'
import PartyCard from '../components/buyer/PartyCard'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import Disclaimer from '../components/ui/Disclaimer'
import Segmented from '../components/ui/Segmented'
import { BangkaIcon } from '../components/home/HomeIcons'
import { PierIcon, RowsIcon } from '../components/icons'
import { byUrgency, isActive, type Catch } from '../data/mock'
import { useCatches } from '../data/store'
import { useUser } from '../lib/auth'
import { between, locate, townOf } from '../lib/geo'
import { useMarket, usualPrice } from '../lib/market'
import { ApiError } from '../lib/api'
import { buyerName, sendOffer, useMyOffers, useMyOrders, useNeedMatches, whenFrom, type ApiOffer, type MatchedNeed, type When } from '../lib/marketApi'
import { matchesFor, type Kind } from '../lib/buyers'
import { countdownText, sellByText } from '../lib/time'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'

type View = 'radar' | 'list'
type Live = { need: MatchedNeed; km: number; bearing: number; mins: number; reach: boolean }

const WHEN: Record<When, string> = { today: 'Today', tomorrow: 'Tomorrow', week: 'This week' }
const RANGES = [5, 10, 20, 40]
const SPEED_KMH = 20 // a tricycle or motorbike on a coastal road
const field = 'min-h-12 w-full rounded-md border border-line bg-mint px-3 text-base font-semibold'

/* One real buyer need, with the offer form for the catch you picked. */
function NeedRow({ live, c, offers, onSent, selected }: { live: Live; c: Catch; offers: ApiOffer[]; onSent: () => void; selected?: boolean }) {
  const need = live.need
  const sent = offers.find((o) => o.needId === need.id && o.catchId === c.id) // the list is newest first
  const active = sent && (sent.status === 'PENDING' || sent.status === 'ACCEPTED')
  const [kg, setKg] = useState(String(Math.min(need.kilos, c.kg)))
  const [price, setPrice] = useState(String(need.pricePerKg ?? usualPrice(c.species)))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const send = async () => {
    const k = Math.min(c.kg, Math.max(1, parseInt(kg, 10) || 1))
    const p = Math.max(1, parseInt(price, 10) || 1)
    setBusy(true)
    setErr('')
    try {
      await sendOffer({ catchId: c.id, buyerId: need.buyerId, needId: need.id, kilos: k, pricePerKg: p })
      onSent()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not send the offer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`space-y-3 rounded-lg border bg-card p-4 shadow-rest ${selected ? 'border-coral' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-numeral text-lg font-bold">{buyerName(need)} needs {need.kilos} kg</h3>
          <p className="text-sm text-ink-soft">{WHEN[whenFrom(need.neededBy)]}{need.pricePerKg ? ` · up to ₱${need.pricePerKg}/kg` : ' · no price limit'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${live.reach ? 'bg-seafoam text-teal' : 'bg-mint text-ink-soft'}`}>
          {live.km.toFixed(1)} km
        </span>
      </div>
      <p className="text-sm font-semibold text-ink-soft">
        About {Math.max(1, Math.round(live.mins))} min away · {live.reach ? 'you can arrive in time' : 'your fish may be too old by then'}
      </p>
      {need.note && <p className="text-sm text-ink-soft">“{need.note}”</p>}

      {active ? (
        <p className="rounded-md bg-seafoam p-3 text-sm font-semibold text-teal">
          {sent.status === 'ACCEPTED' ? 'Accepted' : 'Offer sent, waiting for the buyer'} · {sent.kilos} kg at ₱{sent.pricePerKg}/kg
        </p>
      ) : (
        <div className="space-y-3">
          {sent?.status === 'DECLINED' && <p className="text-sm font-semibold text-risk-critical">Your last offer was declined. You can send a new one.</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm font-semibold">
              Kilos
              <input inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, ''))} className={field} />
            </label>
            <label className="block space-y-1 text-sm font-semibold">
              Your price (₱/kg)
              <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} className={field} />
            </label>
          </div>
          {err && <p role="alert" className="text-sm font-semibold text-risk-critical">{err}</p>}
          <Button className="min-h-12 w-full" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send offer'}</Button>
        </div>
      )}
    </article>
  )
}

export default function Buyers() {
  const t = useT()
  const { lang } = useSettings()
  const { catches, resetDemo: reloadCatches } = useCatches() // resetDemo only reloads from the server
  const user = useUser()
  const { postListing } = useMarket()
  const [params, setParams] = useSearchParams()
  const [kind, setKind] = useState<Kind>('buyer')
  const [view, setView] = useState<View>('radar')
  const [picked, setPicked] = useState<string | null>(null)
  const [pickedNeed, setPickedNeed] = useState<string | null>(null)
  const [range, setRange] = useState(20)
  const [offered, setOffered] = useState<Set<string>>(new Set())

  // a catch with a confirmed order cannot take another offer: it is finished in "Orders to finish", not scanned
  const { orders, reload: reloadOrders } = useMyOrders()
  const selling = new Set(orders.filter((o) => o.status === 'CONFIRMED').map((o) => o.catchId))
  const finish = <OrdersToFinish orders={orders} onChanged={() => { reloadOrders(); reloadCatches() }} />
  const active = catches.filter(isActive).filter((x) => !selling.has(x.id)).sort(byUrgency)
  const c = active.find((x) => x.id === params.get('catch')) ?? active[0]
  const matches = useMemo(() => (c ? matchesFor(c, kind) : []), [c, kind])

  // The real buyers asking for this fish: how far, which way, and can the fish arrive in time
  const here = locate(user.fisher?.landing ?? user.barangay)
  const { needs: found, loading, error, scannedAt, scan } = useNeedMatches(c?.id)
  const { offers: myOffers, reload: reloadOffers } = useMyOffers()
  const lives = useMemo<Live[]>(() => {
    if (!c) return []
    return found
      .map((n) => {
        const { km, bearing } = between(here, locate(n.barangay || n.buyer.barangay), n.id)
        const mins = (km / SPEED_KMH) * 60
        return { need: n, km, bearing, mins, reach: mins <= c.minsMin }
      })
      .sort((a, b) => a.km - b.km)
  }, [found, c, here])

  if (!c) {
    return (
      <div className="space-y-3">
        <h2 className="text-[26px]">{t('nav.buyers')}</h2>
        {finish}
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('buyers.empty')}</p>
      </div>
    )
  }

  const inRange = lives.filter((l) => l.km <= range)
  const selectedLive = inRange.find((l) => l.need.id === pickedNeed) ?? inRange.find((l) => l.reach) ?? inRange[0]
  const blips: Blip[] = lives.map((l) => ({ id: l.need.id, label: buyerName(l.need), place: townOf(l.need.barangay) || l.need.barangay, kg: l.need.kilos, km: l.km, bearing: l.bearing, reach: l.reach }))
  const reachableLive = inRange.filter((l) => l.reach).length

  // The sample side (barangay programs), kept for the Share tab
  const selectedId = matches.some((m) => m.party.id === picked) ? picked : (matches[0]?.party.id ?? null)
  const selected = matches.find((m) => m.party.id === selectedId)
  const reachable = matches.filter((m) => m.reachable).length
  const accent = '#e8735a'
  const offer = (id: string) => {
    setOffered((s) => new Set(s).add(`${c.id}:${id}`))
    if (kind === 'buyer') postListing(c, user.shortName, user.id)
  }
  const isOffered = (id: string) => offered.has(`${c.id}:${id}`)

  const liveRadar = (
    <section className="overflow-hidden rounded-lg shadow-raised" style={{ background: 'linear-gradient(180deg, var(--tide-sky-0), var(--tide-sea-2))' }}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3 text-white">
        <h2 className="font-numeral text-lg font-bold text-white">{t('buyers.radar')}</h2>
        <button type="button" onClick={scan} disabled={loading} className="min-h-11 rounded-full bg-coral px-3 text-xs font-bold text-deep disabled:opacity-60">
          {loading ? 'Scanning…' : 'Scan again'}
        </button>
      </div>
      <p className="px-4 pt-1 text-xs font-semibold text-white/80">
        {error ? error : scannedAt ? `Last scan ${new Date(scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · scans every 15 seconds` : 'Scanning for buyers…'}
      </p>
      <div className="flex flex-wrap gap-2 px-4 pt-3">
        {RANGES.map((r) => <Chip key={r} active={range === r} onClick={() => setRange(r)}>{r} km</Chip>)}
      </div>
      <div className="px-2 pb-1 pt-1">
        <NeedRadar blips={blips} selectedId={selectedLive?.need.id ?? null} onSelect={setPickedNeed} range={range} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-4 text-xs font-semibold text-white">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-cream bg-coral" />Can arrive in time</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-dashed border-white/70" />May be too late</span>
        <span>Number = kilos wanted</span>
      </div>
    </section>
  )

  const sampleRadar = (
    <section className="overflow-hidden rounded-lg shadow-raised" style={{ background: 'linear-gradient(180deg, var(--tide-sky-0), var(--tide-sea-2))' }}>
      <div className="flex items-center justify-between px-4 pt-3 text-white">
        <h2 className="font-numeral text-lg font-bold text-white">{t('buyers.radar')}</h2>
        <span className="rounded-full bg-deep/50 px-2.5 py-0.5 text-xs font-semibold text-white">{t('ui.sample')}</span>
      </div>
      <div className="px-2 pb-1 pt-1">
        <Radar
          matches={matches}
          selectedId={selectedId}
          onSelect={setPicked}
          accent={accent}
          label={(m) => `${m.party.name}, ${m.party.km} km, ${m.reachable ? t('radar.reach') : t('radar.noreach')}`}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-4 text-xs font-semibold text-white">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-cream" style={{ background: accent }} />{t('radar.reach')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-dashed border-white/70" />{t('radar.noreach')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-coral" />{t('buyers.best')}</span>
      </div>
    </section>
  )

  const isLive = kind === 'buyer'

  const radarPanel = view === 'radar' ? (isLive ? liveRadar : sampleRadar) : null

  // the answer side: the buyer you can offer to, or the list of them
  const results = isLive ? (
    inRange.length === 0 ? (
      <p className="rounded-lg border border-dashed border-line bg-card p-6 text-center text-sm font-semibold text-ink-soft">
        {lives.length === 0
          ? `No buyer is asking for ${c.species} right now. Keep this page open, the radar scans again every 15 seconds.`
          : `No buyer within ${range} km. Try a wider range.`}
      </p>
    ) : view === 'radar' && selectedLive ? (
      <>
        <NeedRow key={`${selectedLive.need.id}:${c.id}`} live={selectedLive} c={c} offers={myOffers} onSent={reloadOffers} selected />
        {inRange.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink-soft">Other buyers</p>
            <div className="flex flex-wrap gap-2">
              {inRange.filter((l) => l.need.id !== selectedLive.need.id).map((l) => (
                <Chip key={l.need.id} active={false} onClick={() => setPickedNeed(l.need.id)}>{buyerName(l.need)} · {l.km.toFixed(1)} km</Chip>
              ))}
            </div>
          </div>
        )}
      </>
    ) : (
      inRange.map((l) => <NeedRow key={`${l.need.id}:${c.id}`} live={l} c={c} offers={myOffers} onSent={reloadOffers} />)
    )
  ) : view === 'radar' && selected ? (
    <PartyCard m={selected} kg={c.kg} best={selected.party.id === matches.find((m) => m.reachable)?.party.id} selected offered={isOffered(selected.party.id)} onOffer={() => offer(selected.party.id)} />
  ) : (
    matches.map((m, i) => (
      <PartyCard key={m.party.id} m={m} kg={c.kg} best={i === 0 && m.reachable} offered={isOffered(m.party.id)} onOffer={() => offer(m.party.id)} />
    ))
  )

  return (
    <div className="space-y-5">
      {finish}

      {/* 1. Pick the catch, and see its status, in one card */}
      <section className="space-y-4 rounded-lg border border-line bg-card p-4 shadow-rest">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">{t('va.pick')}</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {active.map((x) => (
              <Chip key={x.id} active={x.id === c.id} onClick={() => { setParams({ catch: x.id }); setPickedNeed(null) }} className="shrink-0">{x.species} · {x.kg} kg</Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-md bg-seafoam p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-teal"><BangkaIcon size={28} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-numeral text-lg font-bold leading-tight">{c.species} · {c.kg} kg</p>
            <p className="text-sm">{c.minsMin > 0 ? `${t('detail.timeleft')}: ${countdownText(c.minsMin)} · ${sellByText(c.hoursMin, lang, t)}` : t('detail.timesup')}</p>
          </div>
          <Link to={`/catches/${c.id}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-teal bg-card px-4 text-sm font-semibold text-teal transition hover:bg-mint">
            {t('va.see')}
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
          </Link>
        </div>
      </section>

      {/* 2. How to look: who to sell to, and radar or list */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap gap-2">
          <Segmented<Kind>
            label={t('nav.buyers')}
            value={kind}
            onChange={(k) => { setKind(k); setPicked(null) }}
            options={[
              { value: 'buyer', label: <><PierIcon size={20} />{t('nav.buyers')}</> },
              { value: 'share', label: t('strand.share') },
            ]}
          />
          <Segmented<View>
            label={t('buyers.radar')}
            value={view}
            onChange={setView}
            options={[
              { value: 'radar', label: t('view.radar') },
              { value: 'list', label: <><RowsIcon size={20} />{t('view.list')}</> },
            ]}
          />
        </div>
        <p className="text-sm font-semibold text-ink-soft">
          {isLive ? `${reachableLive} of ${inRange.length} buyers can be reached in time` : t('buyers.summary', { n: reachable })}
        </p>
      </div>

      {/* 3. The radar beside the answer. In list view the answers sit in a grid. */}
      {radarPanel ? (
        <div className="space-y-5 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-6 lg:space-y-0">
          {radarPanel}
          <div className="space-y-4">{results}</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 md:items-start">{results}</div>
      )}

      {!isLive && <Disclaimer>{t('buyers.note')}</Disclaimer>}
    </div>
  )
}