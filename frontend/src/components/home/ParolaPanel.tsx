import { Link } from 'react-router-dom'
import RiskBadge from '../ui/RiskBadge'
import LifebuoyTimer from './LifebuoyTimer'
import { FISH, WaveArrow } from './HomeIcons'
import type { Catch } from '../../data/mock'
import { sellByText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

// Red and cream stripes, like the markers that warn ships off a reef
const HAZARD = 'repeating-linear-gradient(135deg, var(--color-coral) 0 10px, var(--color-cream) 10px 20px)'

// Cream and coral bands, like a real parola
const left = (y: number) => 47 + ((128 - y) / 70) * 6
const right = (y: number) => 81 - ((128 - y) / 70) * 6
const band = (y1: number, y2: number) => `${left(y1)},${y1} ${right(y1)},${y1} ${right(y2)},${y2} ${left(y2)},${y2}`
const WAVES = 'M0 142q15-6 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0'
const STARS: [number, number, number][] = [[300, 18, 1.8], [330, 40, 1.3], [250, 10, 1.3], [200, 26, 1.8], [345, 12, 1.3], [280, 34, 1.3]]

/* The lighthouse. Its lamp glows coral and its beam sweeps when something needs you. */
function ParolaScene({ alert }: { alert: boolean }) {
  const glow = alert ? 'var(--color-coral)' : 'var(--color-cream)'
  return (
    <svg viewBox="0 0 360 150" className="block w-full" aria-hidden="true">
      <defs>
        <radialGradient id="parola-glow">
          <stop offset="0" style={{ stopColor: glow }} stopOpacity="0.9" />
          <stop offset="1" style={{ stopColor: glow }} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="parola-beam" gradientUnits="userSpaceOnUse" x1="64" y1="0" x2="380" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--color-cream)' }} stopOpacity="0.75" />
          <stop offset="1" style={{ stopColor: 'var(--color-cream)' }} stopOpacity="0" />
        </linearGradient>
      </defs>

      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff" className="anim-twinkle" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}

      <g className="anim-sweep" style={{ transformOrigin: '64px 47px' }}>
        <polygon points="64,47 380,-12 380,36" fill="url(#parola-beam)" />
        <polygon points="64,47 -30,70 -30,28" fill="url(#parola-beam)" fillOpacity="0.35" />
      </g>
      <circle cx="64" cy="47" r="30" fill="url(#parola-glow)" className="anim-glow" />

      <path d="M4 150C14 130 36 125 64 127C92 125 112 132 124 150Z" style={{ fill: 'var(--tide-seabed)' }} />
      <path d="M47 128L53 58H75L81 128Z" style={{ fill: 'var(--color-cream)' }} />
      <polygon points={band(74, 88)} style={{ fill: 'var(--color-coral)' }} />
      <polygon points={band(102, 116)} style={{ fill: 'var(--color-coral)' }} />
      <path d="M47 128L53 58H75L81 128Z" fill="none" stroke="var(--color-deep)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="49" y="54" width="30" height="5" rx="2" style={{ fill: 'var(--color-deep)' }} />
      <path d="M52 54V47M64 54V47M76 54V47" stroke="var(--color-deep)" strokeWidth="1.6" />
      <rect x="55" y="38" width="18" height="16" rx="2" stroke="var(--color-deep)" strokeWidth="2" style={{ fill: glow }} />
      <path d="M64 38V54" stroke="var(--color-deep)" strokeWidth="1.5" />
      <path d="M51 38L64 26L77 38Z" stroke="var(--color-deep)" strokeWidth="2" strokeLinejoin="round" style={{ fill: 'var(--color-coral)' }} />
      <circle cx="64" cy="24" r="2.4" style={{ fill: 'var(--color-deep)' }} />
      <rect x="60" y="116" width="8" height="12" rx="4" style={{ fill: 'var(--color-deep)' }} />

      <g className="anim-drift"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2" /></g>
      <g className="anim-drift-rev" transform="translate(0 6)"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="2" /></g>
    </svg>
  )
}

/* Three fish swimming past: fills the empty part of the panel on a wide screen */
function School() {
  return (
    <svg viewBox="0 0 360 56" className="block w-full" aria-hidden="true">
      {[[24, 30, 1.1, 0.14], [104, 14, 0.8, 0.1], [196, 34, 1.4, 0.16], [290, 18, 0.9, 0.1]].map(([x, y, s, o], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" fillOpacity={o}>
          <path d={FISH} transform="translate(-12 -18)" />
        </g>
      ))}
    </svg>
  )
}

type Props = { urgent: Catch[]; next?: Catch }

export default function ParolaPanel({ urgent, next }: Props) {
  const t = useT()
  const { lang } = useSettings()
  const alert = urgent.length > 0

  return (
    <section
      aria-label={t('home.actions')}
      className="relative flex h-full flex-col overflow-hidden rounded-lg text-white shadow-raised"
      style={{ background: 'linear-gradient(180deg, var(--tide-sky-0) 0%, #0f4a5c 55%, var(--tide-sea-2) 100%)' }}
    >
      <div className="h-1.5 w-full shrink-0" style={{ background: alert ? HAZARD : 'var(--color-teal)' }} aria-hidden="true" />

      <div className="relative">
        <ParolaScene alert={alert} />
        <div className="absolute right-0 top-[30%] left-[40%] pr-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-numeral text-[22px] font-bold leading-tight text-white">{t('home.actions')}</h2>
            {alert && (
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-coral font-numeral text-base font-extrabold text-deep">{urgent.length}</span>
            )}
          </div>
          <p className="mt-1 text-sm leading-snug text-white">{alert ? t('home.urgent') : t('home.calm')}</p>
        </div>
      </div>

      <ul className="space-y-3 px-4 pb-4">
        {urgent.map((c) => (
          <li key={c.id} className="relative rounded-md border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <LifebuoyTimer leftMins={c.minsMin} hoursLabel={t('home.hours')} />
              <div className="min-w-0 flex-1">
                <Link to={`/catches/${c.id}`} className="block font-numeral text-[22px] font-bold leading-tight text-white after:absolute after:inset-0">
                  {c.species}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">{c.kg} kg</span>
                  <RiskBadge level={c.risk} />
                </div>
                <p className="mt-1.5 text-sm leading-snug text-white">{sellByText(c.hoursMin, lang, t)}</p>
              </div>
            </div>
            <Link
              to={`/buyers?catch=${c.id}`}
              className="relative z-10 mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cream text-sm font-semibold text-deep transition active:scale-[0.98]"
            >
              {t('home.findbuyer')}
              <WaveArrow size={22} />
            </Link>
          </li>
        ))}

        {!alert && next && (
          <li>
          <Link to={`/catches/${next.id}`} className="flex items-center gap-3 rounded-md border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <LifebuoyTimer leftMins={next.minsMin} hoursLabel={t('home.hours')} size={72} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-white">{t('home.next')}</p>
              <p className="font-numeral text-xl font-bold leading-tight text-white">{next.species} · {next.kg} kg</p>
              <p className="text-sm text-white">{sellByText(next.hoursMin, lang, t)}</p>
            </div>
          </Link>
          </li>
        )}
      </ul>

      <div className="mt-auto">
        <School />
        <p className="border-t border-white/15 px-4 py-3 text-sm leading-snug text-white">{t('disc.guide')}</p>
      </div>
    </section>
  )
}