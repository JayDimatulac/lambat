import { Clock, MapPin, type LucideIcon } from 'lucide-react'
import { useSettings } from '../../lib/settings'
import type { Sky } from '../../lib/weather'
import WeatherLayers from './WeatherLayers'
import dayImg from '../../assets/bg/weather-day.png'
import nightImg from '../../assets/bg/weather-night.png'

export type HeroStat = { Icon: LucideIcon; label: string; value: string }

type Props = {
  place?: string
  tags?: string[]
  temp: string
  SkyIcon: LucideIcon
  skyLabel: string
  message: string
  bestTime?: string | null
  stats: HeroStat[]
  // what the forecast moves in the picture
  sky?: Sky
  wind?: number // km/h
  wave?: number // m
  rain?: number // % chance
  windDir?: number // degrees, where the wind comes FROM
}

export default function WeatherHero({ place, tags = [], temp, SkyIcon, skyLabel, message, bestTime, stats, sky = 'sun', wind = 0, wave = 0, rain = 0, windDir }: Props) {
  const { theme } = useSettings()
  const night = theme === 'night'

  // If an image file is missing, the gradient after it shows instead
  const image = night ? nightImg : dayImg
  const fallback = night
    ? 'linear-gradient(180deg, #0a2f3c 0%, #0d525e 55%, #05171e 100%)'
    : 'linear-gradient(180deg, #8fd3e3 0%, #d6eff1 55%, #3a9bab 100%)'

  const ink = night ? 'text-white' : 'text-deep'
  const glass = night ? 'bg-deep/55 text-white' : 'bg-white/70 text-deep'
  const divider = night ? 'bg-white/30' : 'bg-deep/25'

  // Whole class strings on purpose, so Tailwind can see them.
  // Phone: the shade runs top to bottom (text sits on the sky). Desktop: left to right.
  const shade = night
    ? 'bg-linear-to-b from-deep/60 via-deep/25 to-transparent lg:bg-linear-to-r lg:from-deep/55 lg:via-deep/10'
    : 'bg-linear-to-b from-white/60 via-white/25 to-transparent lg:bg-linear-to-r lg:from-white/45 lg:via-white/10'
  // Phone: a plain card under the picture. Desktop: glass on top of the picture, top right.
  const statsBox = night ? 'lg:bg-deep/55 lg:text-white' : 'lg:bg-white/70 lg:text-deep'
  const statsLabel = night ? 'lg:text-white/70' : 'lg:text-deep/70'
  const statsIcon = night ? 'lg:text-peach' : ''

  return (
    <div className="relative">
      <section className="relative isolate overflow-hidden rounded-lg shadow-raised">
        {/* the picture and the forecast's layers on it. They sit in one box that is sized and placed like background-size: cover,
            so they always line up. On a phone only a slice shows: 70% 100% = a bit right of centre, bottom edge.
            Change --px and --py if your lantern gets cropped. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 [--px:70%] [--py:100%] lg:[--px:50%] lg:[--py:50%]"
          style={{ containerType: 'size', background: fallback }}
        >
          <div
            className="absolute"
            style={{
              width: 'max(104cqw, calc(104cqh * 1.78774))',
              aspectRatio: '1677 / 938',
              left: 'var(--px)',
              top: 'var(--py)',
              transform: 'translate(calc(var(--px) * -1), calc(var(--py) * -1))',
            }}
          >
            <img src={image} alt="" draggable={false} className="size-full select-none" />
            <WeatherLayers night={night} sky={sky} wind={wind} wave={wave} rain={rain} windDir={windDir} />
          </div>
        </div>
        {/* keeps the text readable on top of any image */}
        <div aria-hidden="true" className={`absolute inset-0 ${shade}`} />

        <div className={`relative z-10 flex min-h-[13rem] flex-col p-5 sm:min-h-[15rem] sm:p-6 lg:min-h-[13rem] lg:p-7 ${ink}`}>
          <div className="min-w-0 space-y-2">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <MapPin size={16} aria-hidden="true" className="shrink-0" />
              {place}
              {tags.map((tag) => (
                <span key={tag} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${glass}`}>
                  {tag}
                </span>
              ))}
            </p>

            <div className="flex items-center gap-3 sm:gap-4">
              <p className="font-numeral text-5xl font-bold leading-none sm:text-6xl">
                {temp}
                <span className="align-top text-3xl sm:text-4xl">°C</span>
              </p>
              <span aria-hidden="true" className={`h-10 w-px shrink-0 ${divider}`} />
              <p className="flex min-w-0 items-center gap-2 font-numeral text-lg font-semibold sm:text-xl">
                <SkyIcon size={28} strokeWidth={1.6} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0">{skyLabel}</span>
              </p>
            </div>

            <p className="max-w-md text-sm leading-snug sm:text-base lg:max-w-[22rem] xl:max-w-md">{message}</p>

            {bestTime && (
              <p className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm sm:text-sm ${glass}`}>
                <Clock size={15} aria-hidden="true" className="shrink-0" />
                {bestTime}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* wind / waves / humidity */}
      <ul
        className={`mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-card px-3 py-3 text-navy shadow-rest lg:absolute lg:right-7 lg:top-7 lg:mt-0 lg:flex lg:gap-8 lg:border-transparent lg:px-5 lg:shadow-none lg:backdrop-blur-sm ${statsBox}`}
      >
        {stats.map(({ Icon, label, value }) => (
          <li key={label} className="flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:gap-2.5 sm:text-left">
            <Icon size={24} strokeWidth={1.6} aria-hidden="true" className={`shrink-0 text-teal ${statsIcon}`} />
            <span className="min-w-0">
              <span className={`block text-[11px] text-ink-soft sm:text-xs ${statsLabel}`}>{label}</span>
              <span className="block font-numeral text-xs font-bold sm:whitespace-nowrap sm:text-base">{value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}