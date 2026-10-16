import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { HandCoins, HeartHandshake, Lock, Sparkles } from 'lucide-react'
import { PierIcon } from '../icons'
import type { Catch } from '../../data/mock'
import { strandsFor, type StrandId, type StrandState } from '../../lib/actions'
import { sellByText } from '../../lib/time'
import { useT, type Key } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
const ORDER: StrandId[] = ['sell', 'buyer', 'share', 'value']
const ICONS: Record<StrandId, Icon> = { sell: HandCoins, buyer: PierIcon, share: HeartHandshake, value: Sparkles }
const TITLES: Record<StrandId, Key> = { sell: 'strand.sell', buyer: 'strand.buyer', share: 'strand.share', value: 'strand.value' }

/* The gutter on the left: a trunk of rope, and a strand that peels off it towards this choice.
   Best choice: thick, glowing, with a current running down it. Open: plain. Locked: slack and dashed. */
function Strand({ status, last }: { status: StrandState['status']; last: boolean }) {
  const branch = status === 'locked' ? 'M12 0C14 72 36 84 50 50' : 'M12 0C12 40 24 50 50 50'
  const style = {
    best: { stroke: 'var(--color-coral)', width: 5 },
    open: { stroke: 'var(--color-teal)', width: 3 },
    locked: { stroke: 'var(--color-ink-soft)', width: 2 },
  }[status]
  return (
    <svg className="w-14 shrink-0 self-stretch overflow-visible" viewBox="0 0 56 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={last ? 'M12 0V50' : 'M12 0V100'} stroke="var(--color-teal)" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
      <path
        d={branch}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.width}
        strokeLinecap="round"
        strokeDasharray={status === 'locked' ? '5 6' : undefined}
        vectorEffect="non-scaling-stroke"
        style={status === 'best' ? { filter: 'drop-shadow(0 0 5px var(--color-coral))' } : undefined}
      />
      {status === 'best' && (
        <path d={branch} fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 34" className="anim-flow" vectorEffect="non-scaling-stroke" />
      )}
      <circle cx="50" cy="50" r="5" style={{ fill: status === 'best' ? 'var(--color-coral)' : status === 'open' ? 'var(--color-teal)' : 'var(--color-ink-soft)' }} />
    </svg>
  )
}

type Props = {
  c: Catch
  onSell: () => void
  onShare: () => void
  onLost: () => void
}

export default function ForkInTheNet({ c, onSell, onShare, onLost }: Props) {
  const t = useT()
  const { lang } = useSettings()
  const states = strandsFor(c)

  const hints: Record<StrandId, string> = {
    sell: sellByText(c.hoursMin, lang, t),
    buyer: t('strand.buyer.hint'),
    share: t('strand.share.hint'),
    value: t('strand.value.hint'),
  }

  const choice = (id: StrandId) => {
    const s = states[id]
    const common = `flex min-h-16 w-full items-center gap-3 rounded-md p-3 text-left transition active:scale-[0.98] ${
      s.status === 'best' ? 'border-2 border-coral bg-card shadow-raised' : 'border border-line bg-card shadow-rest hover:shadow-raised'
    }`
    const lockedCls = 'flex min-h-16 w-full items-center gap-3 rounded-md border border-dashed border-line bg-mint p-3 text-left opacity-80'
    const I = ICONS[id]
    const content = (
      <>
        <span className={`grid size-11 shrink-0 place-items-center rounded-full ${s.status === 'best' ? 'bg-coral text-deep' : 'bg-seafoam text-teal'}`}>
          {s.status === 'locked' ? <Lock size={20} strokeWidth={1.8} aria-hidden /> : <I size={24} strokeWidth={1.8} />}
        </span>
        <span className="min-w-0 flex-1">
          {s.status === 'best' && <span className="mb-1 inline-block rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-deep">{t('detail.best')}</span>}
          <span className="block text-base font-semibold leading-tight">{t(TITLES[id])}</span>
          <span className="block text-sm text-ink-soft">{s.status === 'locked' && s.reason ? t(s.reason) : (s.hint ?? hints[id])}</span>
        </span>
      </>
    )
    if (s.status === 'locked') return <div className={lockedCls} aria-disabled="true">{content}</div>
    if (id === 'buyer') return <Link to={`/buyers?catch=${c.id}`} className={common}>{content}</Link>
    if (id === 'value') return <Link to={`/value-added?catch=${c.id}`} className={common}>{content}</Link>
    return <button type="button" onClick={id === 'sell' ? onSell : onShare} className={common}>{content}</button>
  }

  return (
    <section aria-label={t('detail.fork')}>
      <ul>
        {/* the knot: the catch itself, where the rope splits */}
        <li className="flex">
          <svg className="w-14 shrink-0 self-stretch overflow-visible" viewBox="0 0 56 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M12 50V100" stroke="var(--color-teal)" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
            <circle cx="12" cy="50" r="8" style={{ fill: 'var(--color-cream)' }} stroke="var(--color-deep)" strokeWidth="2.5" />
          </svg>
          <h2 className="py-3 text-xl">{t('detail.fork')}</h2>
        </li>
        {ORDER.map((id, i) => (
          <li key={id} className="flex pb-3">
            <Strand status={states[id].status} last={i === ORDER.length - 1} />
            <div className="min-w-0 flex-1">{choice(id)}</div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onLost} className="mt-1 min-h-12 w-full rounded-full border border-dashed border-line px-4 text-sm font-semibold text-ink-soft hover:bg-seafoam/50">
        {t('outcome.lostlink')}
      </button>
    </section>
  )
}