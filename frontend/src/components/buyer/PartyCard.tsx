import type { ComponentType } from 'react'
import { Check, Church, Flame, GraduationCap, Landmark, Lock, Scale, Store, Users, UtensilsCrossed } from 'lucide-react'
import { WaveArrow } from '../home/HomeIcons'
import { hourLabel, type Match, type PartyType } from '../../lib/buyers'
import { useT, type Key } from '../../lib/i18n'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
const ICON: Record<PartyType, Icon> = { market: Store, trader: Scale, restaurant: UtensilsCrossed, smokehouse: Flame, school: GraduationCap, barangay: Landmark, parish: Church, coop: Users }
const TYPE: Record<PartyType, Key> = { market: 'party.market', trader: 'party.trader', restaurant: 'party.restaurant', smokehouse: 'party.smokehouse', school: 'party.school', barangay: 'party.barangay', parish: 'party.parish', coop: 'party.coop' }

/* How well this one fits: a ring that fills with the match */
function MatchRing({ score }: { score: number }) {
  const len = 2 * Math.PI * 20
  return (
    <div className="relative size-14 shrink-0" role="img" aria-label={`${score}%`}>
      <svg viewBox="0 0 48 48" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" style={{ stroke: 'var(--color-line)' }} />
        <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(len * score) / 100} ${len}`} style={{ stroke: 'var(--color-teal)' }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-numeral text-base font-extrabold">{score}</span>
    </div>
  )
}

type Props = { m: Match; kg: number; best?: boolean; selected?: boolean; offered: boolean; onOffer: () => void; onSelect?: () => void }

export default function PartyCard({ m, kg, best, selected, offered, onOffer, onSelect }: Props) {
  const t = useT()
  const p = m.party
  const Ico = ICON[p.type]
  const share = p.kind === 'share'

  return (
    <article
      className={`relative overflow-hidden rounded-lg border-2 bg-card shadow-rest transition ${best ? 'border-coral shadow-raised' : selected ? 'border-teal' : 'border-line'} ${m.reachable ? '' : 'opacity-85'}`}
    >
      {best && (
        <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-deep" style={{ background: 'repeating-linear-gradient(135deg, var(--color-coral) 0 10px, var(--color-cream) 10px 20px)' }}>
          <span className="rounded-full bg-cream px-2 py-0.5">{t('buyers.best')}</span>
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className={`grid size-12 shrink-0 place-items-center rounded-full ${share ? 'bg-coral text-deep' : 'bg-seafoam text-teal'}`}>
            {m.reachable ? <Ico size={24} strokeWidth={1.8} /> : <Lock size={22} strokeWidth={1.8} aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            {onSelect ? (
              <button type="button" onClick={onSelect} className="block text-left font-numeral text-xl font-bold leading-tight after:absolute after:inset-0">{p.name}</button>
            ) : (
              <h3 className="font-numeral text-xl font-bold leading-tight">{p.name}</h3>
            )}
            <p className="text-sm text-ink-soft">{t(TYPE[p.type])}</p>
          </div>
          {m.reachable && <MatchRing score={m.score} />}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {m.price !== undefined ? (
            <p className="font-numeral text-3xl font-extrabold leading-none text-teal">₱{m.price}<span className="text-base font-bold text-ink-soft">/kg</span></p>
          ) : (
            <p className="font-numeral text-3xl font-extrabold leading-none text-coral">{t('buyers.free')}</p>
          )}
          <p className="text-sm font-semibold">{t('buyers.eta', { n: m.travelMins })} · {p.km} km</p>
        </div>
        <p className="text-sm text-ink-soft">
          {m.total !== undefined ? t('buyers.total', { n: m.total.toLocaleString('en-US'), kg }) : t('buyers.cap', { n: p.capacityKg ?? 0 })}
          {' · '}
          {t('buyers.closes', { time: hourLabel(p.closes) })}
        </p>

        {m.reachable ? (
          <>
            <div className="flex flex-wrap gap-1.5">{m.why.map((k) => <span key={k} className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold">{t(k)}</span>)}</div>
            <button
              type="button"
              disabled={offered}
              onClick={onOffer}
              className="relative z-10 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-coral text-sm font-semibold text-deep transition active:scale-[0.98] disabled:bg-seafoam disabled:text-teal"
            >
              {offered ? <Check size={20} strokeWidth={2.4} aria-hidden /> : null}
              {offered ? t('buyers.offered') : share ? t('buyers.offer.share') : t('buyers.offer')}
              {!offered && <WaveArrow size={22} />}
            </button>
          </>
        ) : (
          <p className="flex items-center gap-2 rounded-md bg-mint px-3 py-2 text-sm font-semibold">
            <Lock size={16} strokeWidth={1.8} aria-hidden />
            {m.no ? t(m.no) : ''}
          </p>
        )}
      </div>
    </article>
  )
}