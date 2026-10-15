import { Link } from 'react-router-dom'
import { ArrowRight, Waves, Wind } from 'lucide-react'
import TideScene from '../components/tide/TideScene'
import Tally from '../components/Tally'
import Disclaimer from '../components/ui/Disclaimer'
import { RISK_ICON } from '../components/ui/RiskBadge'
import { KnotPlusIcon } from '../components/icons'
import { byUrgency, catches, isActive, user, weekOutcomes } from '../data/mock'
import { RISK } from '../lib/risk'
import { sellByText } from '../lib/time'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'

export default function Dashboard() {
  const t = useT()
  const { lang } = useSettings()
  const now = new Date()
  const hour = now.getHours()
  const greet = hour < 12 ? t('greet.morning') : hour < 18 ? t('greet.afternoon') : t('greet.evening')
  const date = now.toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const active = catches.filter(isActive).sort(byUrgency)
  const urgent = active.filter((c) => c.risk === 'high' || c.risk === 'critical').slice(0, 2)

  const { sold, shared, lost } = weekOutcomes
  const pct = Math.round(((sold.kg + shared.kg) / (sold.kg + shared.kg + lost.kg)) * 100)
  const tally = [
    { key: 'sold', n: sold.n, color: 'text-teal' },
    { key: 'shared', n: shared.n, color: 'text-coral' },
    { key: 'lost', n: lost.n, color: 'text-ink-soft' },
  ] as const

  const header = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="pt-2 text-sm font-medium text-white">{date}</p>
        <Link to="/weather" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-deep/40 px-3 text-sm font-semibold text-white">
          <Wind size={16} strokeWidth={1.8} aria-hidden />
          {t('home.wind')}
        </Link>
      </div>
      <p className="mt-1 font-display text-[22px] font-semibold leading-tight text-white">
        {greet}, {user.name}
      </p>
    </>
  )

  return (
    <div className="space-y-5">
      {/* 1. THE HERO */}
      <TideScene catches={active.slice(0, 4)} header={header} />

      {/* 2. THE ONE PRIMARY ACTION */}
      <Link to="/catches/new" className="flex min-h-[72px] items-center gap-4 rounded-md bg-coral px-5 py-3 text-deep shadow-raised transition active:scale-[0.98]">
        <span className="grid size-12 place-items-center rounded-full bg-deep/10">
          <KnotPlusIcon size={28} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-xl font-semibold">{t('home.log')}</span>
          <span className="simple-hide block text-sm">{t('home.log.sub')}</span>
        </span>
        <ArrowRight size={22} strokeWidth={1.8} aria-hidden />
      </Link>

      {/* 3. NEEDS ACTION */}
      <section className="space-y-3">
        <h2 className="text-xl">{t('home.actions')}</h2>
        {urgent.length === 0 ? (
          <p className="flex items-center gap-3 rounded-md border border-line bg-card p-4 text-ink-soft">
            <Waves size={24} strokeWidth={1.8} className="text-teal" aria-hidden />
            {t('home.calm')}
          </p>
        ) : (
          <ul className="space-y-3">
            {urgent.map((c) => {
              const r = RISK[c.risk]
              const Icon = RISK_ICON[c.risk]
              return (
                <li key={c.id} className={`relative flex flex-wrap items-center gap-3 rounded-md border-2 bg-card p-3 shadow-rest ${r.line}`}>
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full ${r.bg} ${r.text}`}>
                    <Icon size={24} strokeWidth={1.8} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 basis-40">
                    <Link to={`/catches/${c.id}`} className="font-semibold after:absolute after:inset-0">
                      {c.species} · {c.kg} kg
                    </Link>
                    <p className="text-sm text-ink-soft">{sellByText(c.hoursMin, lang, t)}</p>
                  </div>
                  <Link to={`/buyers?catch=${c.id}`} className="relative z-10 inline-flex min-h-12 items-center gap-1.5 rounded-full bg-coral px-4 text-sm font-semibold text-deep">
                    {t('home.findbuyer')}
                    <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <Disclaimer />
      </section>

      {/* 4. THIS WEEK, AS A TALLY */}
      <section className="space-y-3 rounded-md border border-line bg-card p-4 shadow-rest">
        <div>
          <p className="text-sm font-semibold text-ink-soft">{t('home.week')}</p>
          <p className="font-display text-lg font-semibold leading-snug">{t('tally.summary', { pct })}</p>
        </div>
        <ul className="divide-y divide-line">
          {tally.map((row) => (
            <li key={row.key} className="grid min-h-14 grid-cols-[7rem_1fr] items-center gap-3 py-2">
              <p>
                <span className="font-display text-2xl font-bold">{row.n}</span>{' '}
                <span className="text-sm font-semibold">{t(`tally.${row.key}`)}</span>
              </p>
              <Tally count={row.n} className={row.color} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}