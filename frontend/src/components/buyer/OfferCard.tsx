import { RISK } from '../../lib/risk'
import { hoursLeft, riskOf, usualPrice, type Listing } from '../../lib/market'
import { countdownText } from '../../lib/time'
import { useBT } from '../../lib/buyerText'
import RiskBadge from '../ui/RiskBadge'
import { LanternIcon } from './BuyerIcons'

const HAZARD = 'repeating-linear-gradient(135deg, var(--color-coral) 0 10px, var(--color-cream) 10px 20px)'

/* Ice meter: eight blocks of ice. They melt away (from the right) as the time left runs out. */
function IceMeter({ hours, fill }: { hours: number; fill: string }) {
  const on = Math.min(8, Math.ceil(hours / 3))
  return (
    <div className="flex gap-1" role="img" aria-label={`${Math.floor(hours)} h`}>
      {Array.from({ length: 8 }, (_, i) => (
        <i key={i} className="block h-3 flex-1 rounded-[4px]" style={{ background: i < on ? fill : 'var(--color-line)', opacity: i < on ? 1 : 0.7 }} />
      ))}
    </div>
  )
}

/* Is the asking price low, usual or high? A small scale with a notch for the usual price. */
function Fairness({ ask, usual }: { ask: number; usual: number }) {
  const b = useBT()
  const ratio = ask / usual
  const pos = Math.max(0, Math.min(1, (ratio - 0.7) / 0.6)) * 100
  const word = ratio < 0.95 ? b('fair.low') : ratio > 1.05 ? b('fair.high') : b('fair.usual')
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs font-semibold text-ink-soft">
        <span>{b('fair.title')}: <b className="text-navy">{word}</b></span>
        <span>{b('fair.usual.price', { n: usual })}</span>
      </div>
      <div className="relative h-2 rounded-full bg-line">
        <i className="absolute left-1/2 top-[-3px] h-[14px] w-0.5 -translate-x-1/2 bg-deep" aria-hidden="true" />
        <i className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream bg-teal" style={{ left: `${pos}%` }} aria-hidden="true" />
      </div>
    </div>
  )
}

type Props = { l: Listing; now: number; match?: boolean; onBuy: () => void; onOffer: () => void }

export default function OfferCard({ l, now, match, onBuy, onOffer }: Props) {
  const b = useBT()
  const risk = riskOf(l, now)
  const hrs = hoursLeft(l, now)
  const urgent = risk === 'critical' || risk === 'high'
  const usual = usualPrice(l.species)
  return (
    <article className={`overflow-hidden rounded-lg border-2 bg-card shadow-rest ${urgent ? 'border-coral shadow-raised' : 'border-line'}`}>
      <div className="flex items-center justify-between gap-2 px-4 py-2" style={urgent ? { background: HAZARD } : { background: 'var(--color-seafoam)' }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-deep">
          <LanternIcon size={16} />
          {urgent ? b('offer.rescue') : b('offer.fresh')}
        </span>
        <span className="rounded-full bg-card/90 px-2.5 py-1 font-numeral text-sm font-bold text-deep">{countdownText(Math.floor(hrs * 60))}</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-numeral text-2xl font-bold leading-tight">{l.species} · {l.kg} kg</h3>
            <p className="text-sm text-ink-soft">{l.fisher} · {l.place}{l.sample ? ` · ${b('sample')}` : ''}</p>
          </div>
          <RiskBadge level={risk} />
        </div>
        {match && <p className="inline-flex rounded-full bg-seafoam px-3 py-1 text-xs font-bold text-teal">{b('offer.match')}</p>}
        <IceMeter hours={hrs} fill={RISK[risk].fill} />
        <div className="flex flex-wrap items-baseline gap-x-4">
          <p className="font-numeral text-3xl font-extrabold leading-none text-teal">₱{l.ask}<span className="text-base font-bold text-ink-soft">/kg</span></p>
          <p className="text-sm font-semibold">{b('offer.total', { n: (l.ask * l.kg).toLocaleString('en-US') })}</p>
        </div>
        <Fairness ask={l.ask} usual={usual} />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button type="button" onClick={onBuy} className="min-h-12 rounded-full bg-coral text-sm font-semibold text-deep transition active:scale-[0.98]">{b('offer.buy')}</button>
          <button type="button" onClick={onOffer} className="min-h-12 rounded-full border-2 border-teal text-sm font-semibold text-teal transition active:scale-[0.98]">{b('offer.counter')}</button>
        </div>
      </div>
    </article>
  )
}