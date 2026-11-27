import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import RiskBadge from '../ui/RiskBadge'
import LifebuoyTimer from './LifebuoyTimer'
import { WaveArrow } from './HomeIcons'
import { needsAttention, type Catch } from '../../data/mock'
import { pickHeroCatches } from '../../lib/heroCatches'
import { sellByText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

// Red and cream stripes, like the markers that warn ships off a reef
const HAZARD = 'repeating-linear-gradient(135deg, var(--color-coral) 0 10px, var(--color-cream) 10px 20px)'

/* Phone: the one catch to deal with now, with one button. Urgent catches get the striped top edge.
   With no active catch it shows nothing, because the sea hero above already has the Log a catch button. */
export default function NextUp({ catches }: { catches: Catch[] }) {
  const t = useT()
  const { lang } = useSettings()
  const c = pickHeroCatches(catches, 1)[0]
  if (!c) return null
  const alert = c.risk === 'high' || c.risk === 'critical'
  const waiting = catches.filter((x) => !x.outcome && needsAttention(x)).length

  return (
    <section aria-label={alert ? t('home.actions') : t('home.next')} className="overflow-hidden rounded-2xl bg-deep text-white shadow-raised lg:hidden">
      <div className="h-1.5 w-full" style={{ background: alert ? HAZARD : 'var(--color-teal)' }} aria-hidden="true" />
      <div className="p-4">
        <div className="flex items-center gap-4">
          <LifebuoyTimer leftMins={c.minsMin} hoursLabel={t('home.hours')} size={84} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">{alert ? t('home.actions') : t('home.next')}</p>
            <Link to={`/catches/${c.id}`} className="block truncate font-numeral text-xl font-bold leading-tight">{c.species} · {c.kg} kg</Link>
            <div className="mt-1.5"><RiskBadge level={c.risk} /></div>
            <p className="mt-1.5 text-sm leading-snug text-white/90">{sellByText(c.hoursMin, lang, t)}</p>
          </div>
        </div>
        <Link
          to={`/buyers?catch=${c.id}`}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-coral font-bold text-deep shadow-raised transition active:scale-[0.98]"
        >
          {t('home.findbuyer')}
          <WaveArrow size={22} />
        </Link>
        {waiting > 1 && (
          <Link to="/catches?filter=attention" className="mt-2 flex min-h-11 items-center justify-center gap-1 text-sm font-semibold text-white/90">
            {t('home.priority', { n: waiting })}
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  )
}