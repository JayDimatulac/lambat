import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Catch } from '../../data/mock'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import RiskBadge from '../ui/RiskBadge'

// Finds the pictures anywhere under src/, so it works from src/bg/ or src/assets/bg/.
// If one is missing, the gradient below shows instead of breaking the build.
const pictures = import.meta.glob('../../**/value-added-*.webp', { eager: true, import: 'default' }) as Record<string, string>
const pick = (name: string) => Object.entries(pictures).find(([path]) => path.endsWith(`/${name}`))?.[1]
const dayImg = pick('value-added-day.webp')
const nightImg = pick('value-added-night.webp')

export function ValueHero({ c, children }: { c: Catch | null; children?: ReactNode }) {
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
    <header className={`relative isolate overflow-hidden rounded-xl px-5 py-6 sm:px-8 sm:py-7 ${ink}`}>
      {/* the picture; the gradient sits behind it as a fallback */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-[position:70%_100%] md:bg-center"
        style={{ backgroundImage: image ? `url(${image}), ${fallback}` : fallback }}
      />
      {/* keeps the text readable on top of the picture */}
      <div aria-hidden="true" className={`absolute inset-0 -z-10 ${shade}`} />
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{t('va.h.title')}</h1>
          <p className={`mt-2 max-w-xl text-sm sm:text-base ${sub}`}>{t('va.h.sub')}</p>
        </div>
        {c && (
          <div className={`w-full space-y-2.5 rounded-xl border p-3.5 backdrop-blur-sm md:w-80 ${glass}`}>
            <p className="text-xs font-semibold opacity-85">{t('va.selected')}</p>
            {children}
            <div className="flex items-center justify-between gap-2">
              <RiskBadge level={c.risk} />
              <Link className="flex min-h-10 items-center gap-1.5 text-sm font-semibold underline" to={`/catches/${c.id}`}>
                {t('va.viewcatch')} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}