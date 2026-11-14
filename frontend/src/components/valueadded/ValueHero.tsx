import { ArrowRight, CircleDollarSign, Recycle, ShieldCheck, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Catch } from '../../data/mock'
import { useT } from '../../lib/i18n'
import RiskBadge from '../ui/RiskBadge'

export function ValueHero({ c }: { c: Catch | null }) {
  const t = useT()

  return (
    <header className="relative isolate overflow-hidden rounded-xl bg-deep px-6 py-10 text-white sm:px-10">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-deep via-teal to-deep" />
      <div aria-hidden="true" className="hero-veil absolute inset-0 -z-10" />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
            {t('va.h.title')}
            <span className="block text-white/85">{t('va.h.title2')}</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/90">{t('va.h.sub')}</p>
        </div>
        {c && (
          <div className="rounded-lg border border-white/30 bg-deep/75 p-4">
            <p className="text-sm font-semibold text-white/85">{t('va.selected')}</p>
            <p className="my-2 text-xl font-bold">{c.species} · {c.kg} kg</p>
            <RiskBadge level={c.risk} />
            <Link className="mt-2 flex min-h-11 items-center gap-2 font-semibold underline" to={`/catches/${c.id}`}>
              {t('va.viewcatch')} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

const benefits = [
  { icon: CircleDollarSign, title: 'va.ben1.t', description: 'va.ben1.d' },
  { icon: Store, title: 'va.ben2.t', description: 'va.ben2.d' },
  { icon: Recycle, title: 'va.ben3.t', description: 'va.ben3.d' },
  { icon: ShieldCheck, title: 'va.ben4.t', description: 'va.ben4.d' },
] as const

export function BenefitStrip() {
  const t = useT()

  return (
    <ul className="grid gap-4 rounded-lg border border-line bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
      {benefits.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-start gap-3">
          <Icon size={22} className="shrink-0 text-teal" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t(title)}</p>
            <p className="text-sm text-ink-soft">{t(description)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}