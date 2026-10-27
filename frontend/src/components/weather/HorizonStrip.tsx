import { Cloud, CloudRain, CloudSun, Moon, Sun } from 'lucide-react'
import { BangkaIcon, PennantIcon } from '../home/HomeIcons'
import { calmWindow, hour12, windWindow, type Hour } from '../../lib/weather'
import { useT } from '../../lib/i18n'

// Today along one horizon: the sky and the wind in a column for every hour, and the sea itself as a line
// that rises and falls with the waves. A hazard-striped band marks the hours to stay ashore.
const COL = 58
const H = 84

const icon = (x: Hour) => {
  const night = x.h < 6 || x.h >= 18
  if (x.rain >= 40) return CloudRain
  if (x.sky === 'cloud') return Cloud
  if (x.sky === 'partly') return night ? Moon : CloudSun
  return night ? Moon : Sun
}
const windColor = (w: number) => (w >= 35 ? 'var(--color-risk-critical-line)' : w >= 22 ? 'var(--color-risk-moderate-line)' : 'var(--color-teal)')

/* One small pennant for every 12 km/h of wind, up to four */
function Pennants({ wind }: { wind: number }) {
  const n = Math.min(4, Math.max(1, Math.ceil(wind / 12)))
  return (
    <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true">
      <path d="M4 2V32" stroke="var(--color-ink-soft)" strokeWidth="2" strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M4 ${3 + i * 7.5}L22 ${6.2 + i * 7.5}L4 ${9.4 + i * 7.5}Z`} strokeWidth="1.2" strokeLinejoin="round" style={{ fill: windColor(wind), stroke: 'var(--color-deep)' }} />
      ))}
    </svg>
  )
}

export default function HorizonStrip({ hours, nowHour }: { hours: Hour[]; nowHour: number }) {
  const t = useT()
  const calm = calmWindow(hours)
  const strong = windWindow(hours)
  const W = hours.length * COL
  const x = (i: number) => COL * (i + 0.5)
  const y = (h: Hour) => 52 - h.wave * 18

  // a smooth line through the wave heights
  let line = `M${x(0)} ${y(hours[0])}`
  hours.forEach((hr, i) => {
    if (i === hours.length - 1) line += `L${x(i)} ${y(hr)}`
    else line += `Q${x(i)} ${y(hr)} ${(x(i) + x(i + 1)) / 2} ${(y(hr) + y(hours[i + 1])) / 2}`
  })
  const nowIdx = hours.findIndex((hr) => hr.h === nowHour)
  const bandFrom = strong ? hours.findIndex((hr) => hr.h === strong.from) : -1
  const bandTo = strong ? hours.findIndex((hr) => hr.h === strong.to - 1) : -1

  return (
    <section className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-rest">
      <h2 className="font-numeral text-xl font-bold leading-none">{t('wx.hourly')}</h2>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-seafoam px-3 py-1.5 text-sm font-semibold text-teal">
          <BangkaIcon size={20} />
          {calm ? `${t('wx.best')}: ${hour12(calm.from)} – ${hour12(calm.to)}` : t('wx.nowindow')}
        </span>
        {strong && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-critical-bg px-3 py-1.5 text-sm font-semibold text-risk-critical">
            <PennantIcon size={20} />
            {t('wx.avoid')}: {hour12(strong.from)} – {hour12(strong.to)}
          </span>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div style={{ width: W }}>
          <div className="flex">
            {hours.map((hr) => {
              const Icon = icon(hr)
              const now = hr.h === nowHour
              return (
                <div key={hr.h} className={`flex flex-col items-center gap-1 rounded-t-md py-1.5 ${now ? 'bg-seafoam' : ''}`} style={{ width: COL }}>
                  <span className={`text-xs font-bold ${now ? 'text-teal' : 'text-ink-soft'}`}>{now ? t('when.nowlabel') : hour12(hr.h)}</span>
                  <Icon size={24} strokeWidth={1.8} className="text-teal" aria-hidden />
                  <Pennants wind={hr.wind} />
                  <span className="font-numeral text-lg font-bold leading-none tabular-nums">{hr.wind}</span>
                </div>
              )
            })}
          </div>

          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={t('wx.wave')}>
            <defs>
              <linearGradient id="strip-water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--tide-sea-0)' }} />
                <stop offset="1" style={{ stopColor: 'var(--tide-sea-2)' }} />
              </linearGradient>
              <pattern id="strip-hazard" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="12" style={{ fill: 'var(--color-coral)' }} />
                <rect x="6" width="6" height="12" style={{ fill: 'var(--color-cream)' }} />
              </pattern>
            </defs>
            <path d={`${line}L${x(hours.length - 1)} ${H}L${x(0)} ${H}Z`} fill="url(#strip-water)" />
            {bandFrom >= 0 && bandTo >= bandFrom && (
              <g>
                <rect x={bandFrom * COL} y="0" width={(bandTo - bandFrom + 1) * COL} height={H} style={{ fill: 'var(--color-coral)' }} fillOpacity="0.22" />
                <rect x={bandFrom * COL} y="0" width={(bandTo - bandFrom + 1) * COL} height="5" fill="url(#strip-hazard)" />
              </g>
            )}
            <path d={line} fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2.4" strokeLinecap="round" />
            {hours.map((hr, i) => (
              <text key={hr.h} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">{hr.wave}m</text>
            ))}
            {nowIdx >= 0 && (
              <g transform={`translate(${x(nowIdx) - 14} ${y(hours[nowIdx]) - 24})`}>
                <path d="M2 18C6 22 22 22 26 18Z" stroke="var(--color-deep)" strokeWidth="1.6" strokeLinejoin="round" style={{ fill: 'var(--color-coral)' }} />
                <path d="M14 18V4" stroke="var(--color-deep)" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M14 4L23 16H14Z" stroke="var(--color-deep)" strokeWidth="1.6" strokeLinejoin="round" style={{ fill: 'var(--color-cream)' }} />
              </g>
            )}
          </svg>
        </div>
      </div>
    </section>
  )
}