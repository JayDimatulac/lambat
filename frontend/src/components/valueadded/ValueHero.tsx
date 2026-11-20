import { ArrowRight, CircleDollarSign, Recycle, ShieldCheck, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Catch } from '../../data/mock'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import RiskBadge from '../ui/RiskBadge'

// Finds the pictures anywhere under src/, so it works from src/bg/ or src/assets/bg/.
// If one is missing, the gradient below shows instead of breaking the build.
const pictures = import.meta.glob('../../**/value-added-*.png', { eager: true, import: 'default' }) as Record<string, string>
const pick = (name: string) => Object.entries(pictures).find(([path]) => path.endsWith(`/${name}`))?.[1]
const dayImg = pick('value-added-day.png')
const nightImg = pick('value-added-night.png')

export function ValueHero({ c }: { c: Catch | null }) {
  const t = useT()
  const { theme } = useSettings()
  const night = theme === 'night'

  const image = night ? nightImg : dayImg
  const fallback = night
    ? 'linear-gradient(135deg, #0a2f3c 0%, #0d525e 55%, #05171e 100%)'
    : 'linear-gradient(135deg, #8fd3e3 0%, #d6eff1 55%, #3a9bab 100%)'

  // Whole class strings on purpose, so Tailwind can see them.
  const ink = night ? 'text-white' : 'text-deep'
  const sub = night ? 'text-white/90' : 'text-deep/90'
  const shade = night
    ? 'bg-linear-to-b from-deep/60 via-deep/25 to-transparent md:bg-linear-to-r md:from-deep/60 md:via-deep/15'
    : 'bg-linear-to-b from-white/60 via-white/25 to-transparent md:bg-linear-to-r md:from-white/55 md:via-white/10'
  const glass = night ? 'border-white/30 bg-deep/70 text-white' : 'border-white/60 bg-white/75 text-deep'

  return (
    <header className={`relative isolate overflow-hidden rounded-xl px-6 py-10 sm:px-10 ${ink}`}>
      {/* the picture; the gradient sits behind it as a fallback */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-[position:70%_100%] md:bg-center"
        style={{ backgroundImage: image ? `url(${image}), ${fallback}` : fallback }}
      />
      {/* keeps the text readable on top of the picture */}
      <div aria-hidden="true" className={`absolute inset-0 -z-10 ${shade}`} />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
            {t('va.h.title')}
            <span className={`block ${sub}`}>{t('va.h.title2')}</span>
          </h1>
          <p className={`mt-3 max-w-xl ${sub}`}>{t('va.h.sub')}</p>
        </div>
        {c && (
          <div className={`rounded-lg border p-4 backdrop-blur-sm ${glass}`}>
            <p className="text-sm font-semibold opacity-85">{t('va.selected')}</p>
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