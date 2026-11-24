import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronRight, Info, MapPin } from 'lucide-react'
import TideScene from '../components/tide/TideScene'
import BuoyStrip from '../components/home/BuoyStrip'
import NetTally from '../components/home/NetTally'
import ParolaPanel from '../components/home/ParolaPanel'
import WeatherCard from '../components/home/WeatherCard'
import { PennantIcon } from '../components/home/HomeIcons'
import { byUrgency, isActive, needsAttention, weekBase, type Outcome } from '../data/mock'
import { pickHeroCatches } from '../lib/heroCatches'
import { useCatches } from '../data/store'
import { useUser } from '../lib/auth'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'
import { localeOf } from '../lib/time'
import { hour12, useForecast, windOutlook } from '../lib/weather'
import weatherIcon from '../assets/icons/quick-weather.png'
import buyersIcon from '../assets/icons/quick-buyers.png'
import valueIcon from '../assets/icons/quick-value.png'
import logIcon from '../assets/icons/quick-log.png'

export default function Dashboard() {
  const t = useT()
  const { lang } = useSettings()
  const { catches } = useCatches()
  const user = useUser()
  const place = user.fisher?.landing ?? user.barangay
  const forecast = useForecast(user.fisher?.landing)
  const now = new Date()
  const hour = now.getHours()
  const greet =
    hour < 12
      ? t('greet.morning')
      : hour < 18
        ? t('greet.afternoon')
        : t('greet.evening')
  const date = now.toLocaleDateString(localeOf(lang), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const active = catches.filter(isActive).sort(byUrgency)
  const urgent = active.filter((c) => c.risk === 'high' || c.risk === 'critical').slice(0, 2)
  const next = active.find((c) => !urgent.includes(c))

  // Phones: the hero shows up to two active catches (Unahin first, then the least time left). The strip below lists every catch.
  const priorityCount = active.filter(needsAttention).length
  const heroCatches = pickHeroCatches(catches)
  const stripCatches = [...active, ...catches.filter((c) => !isActive(c))]

  const sum = (outcome: Outcome) => {
    const closed = catches.filter((c) => c.outcome === outcome)
    const base = user.demo ? weekBase[outcome] : { n: 0, kg: 0 }

    return {
      n: base.n + closed.length,
      kg: base.kg + closed.reduce((total, c) => total + c.kg, 0),
    }
  }

  const outlook = forecast.live ? windOutlook(forecast.hours, hour) : null
  let windText = t('nav.weather')

  if (outlook?.kind === 'calm') {
    windText = t('home.wind.calm')
  } else if (outlook?.kind === 'from') {
    windText = t('home.wind.from', { from: hour12(outlook.from) })
  } else if (outlook?.kind === 'until') {
    windText = t('home.wind', { to: hour12(outlook.to) })
  }

  const filipino = lang === 'fil'
  const shortcuts = [
    {
      to: '/weather',
      icon: weatherIcon,
      title: filipino ? 'Tingnan ang panahon' : 'Check Weather',
      description: filipino ? 'Alamin ang kondisyon ng dagat' : 'See sea conditions',
      color: 'from-[#effbff] to-[#bce7ef]',
    },
    {
      to: '/buyers',
      icon: buyersIcon,
      title: filipino ? 'Humanap ng mamimili' : 'Find Buyers',
      description: filipino ? 'Kumonekta sa mga mamimili' : 'Connect with buyers',
      color: 'from-[#ecfaf6] to-[#b8e8dd]',
    },
    {
      to: '/value-added',
      icon: valueIcon,
      title: filipino ? 'Mga ideya para sa huli' : 'Value-Added Ideas',
      description: filipino ? 'Dagdagan ang halaga ng huli' : 'Get more value from your catch',
      color: 'from-[#effbff] to-[#bce7ef]',
    },
  ]

  const header = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarDays size={17} aria-hidden="true" className="shrink-0" />
            {date}
          </p>
          <p className="flex items-center gap-2 text-xs font-medium text-white/90">
            <MapPin size={15} aria-hidden="true" className="shrink-0" />
            {place}
          </p>
        </div>

        {/* the wind pill is left out on small phones: the weather preview sits right below the strip */}
        <Link
          to="/weather"
          className="hidden min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-deep/50 px-3 text-xs font-semibold text-white sm:inline-flex sm:text-sm"
        >
          <PennantIcon size={18} />
          {windText}
        </Link>
      </div>

      <h1 className="mt-2 font-numeral text-2xl font-bold leading-tight text-white xl:text-[30px]">
        {greet}, {user.shortName}{' '}
        <span aria-hidden="true">👋</span>
      </h1>
    </>
  )

  // Phones: just the greeting and place. The date and wind pill are left out to keep the hero short.
  const phoneHeader = (
    <>
      <h1 className="font-numeral text-xl font-bold leading-tight text-white">
        {greet}, {user.shortName} <span aria-hidden="true">👋</span>
      </h1>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white/95">
        <MapPin size={15} aria-hidden="true" className="shrink-0" />
        {place}
      </p>
    </>
  )

  return (
    <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-stretch lg:gap-5">
      {/* LEFT: timeline, the one primary action, quick actions, weekly utilization */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
        {/* Phones: the sea hero with only the two catches that need attention most. */}
        <div className="order-1 lg:hidden">
          <TideScene
            compact
            catches={heroCatches}
            header={phoneHeader}
            flagFirst
            emptyText={t('home.none')}
            emptyAction={
              <Link
                to="/catches/new"
                className="pointer-events-auto mt-2 inline-flex min-h-11 items-center rounded-full bg-white/90 px-4 text-sm font-semibold text-deep active:scale-[0.98]"
              >
                {t('home.log')}
              </Link>
            }
          />
        </div>

        {/* Desktop: the full sea scene with every buoy (up to 4). */}
        <div className="hidden lg:order-1 lg:block">
          <TideScene catches={active.slice(0, 4)} header={header} />
        </div>

        {/* Only when more catches need attention than the hero can show */}
        {priorityCount > 2 && (
          <Link
            to="/catches?filter=attention"
            className="order-2 flex min-h-14 items-center gap-3 rounded-2xl border border-risk-moderate-line bg-risk-moderate-bg px-4 font-semibold text-risk-moderate transition active:scale-[0.98] lg:hidden"
          >
            <PennantIcon size={22} />
            <span className="min-w-0 flex-1">{t('home.priority', { n: priorityCount })}</span>
            <ChevronRight size={22} aria-hidden="true" />
          </Link>
        )}

        <BuoyStrip catches={stripCatches} />

        <Link
          to="/catches/new"
          className="hidden min-h-14 items-center gap-3 rounded-full border border-white/70 bg-linear-to-r from-[#ffb78d] via-[#ff925f] to-[#ff7946] px-2 pr-4 text-deep shadow-raised transition hover:brightness-105 active:scale-[0.98] lg:order-2 lg:flex xl:min-h-16"
        >
          <span className="grid size-12 shrink-0 place-items-center">
            <img src={logIcon} alt="" aria-hidden="true" draggable={false} className="size-14 object-contain drop-shadow-md" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-numeral text-lg font-bold leading-tight">{t('home.log')}</span>
            <span className="simple-hide block text-xs font-medium sm:text-sm">{t('home.log.sub')}</span>
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black/15 text-white">
            <ArrowRight size={21} aria-hidden="true" />
          </span>
        </Link>

        {/* Quick actions: equal-height tiles, same icon box, same 2-line title box, so everything lines up */}
        <div className="order-5 hidden grid-cols-3 items-stretch gap-2 sm:gap-3 lg:order-3 lg:grid">
          {shortcuts.map(({ to, icon, title, description, color }) => (
            <Link
              key={to}
              to={to}
              className={`shortcut-tile flex h-full min-h-[120px] flex-col items-center justify-start rounded-[20px] border border-white/80 bg-linear-to-br ${color} px-2 pb-3 pt-3 text-center text-deep shadow-rest transition hover:-translate-y-0.5 active:scale-[0.98] xl:min-h-[140px]`}
            >
              <span className="mb-1.5 grid size-14 shrink-0 place-items-center sm:size-16" aria-hidden="true">
                <img src={icon} alt="" draggable={false} className="size-full object-contain" />
              </span>
              <span className="flex min-h-[2.25rem] items-center justify-center text-sm font-bold leading-tight">
                {title}
              </span>
              <span className="simple-hide mt-0.5 hidden text-xs leading-tight sm:block">{description}</span>
            </Link>
          ))}
        </div>

        <div className="order-7 lg:order-4">
          <NetTally sold={sum('sold')} shared={sum('shared')} lost={sum('lost')} />
        </div>
      </div>

      {/* RIGHT: needs action + weather share the left column's height. On a phone: hero, strip, weather, shortcuts, tally. */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
        <div className="hidden lg:block lg:flex-1 [&>*]:h-full">
          <ParolaPanel urgent={urgent} next={next} />
        </div>
        <div className="order-4 lg:flex-1 [&>*]:h-full">
          <WeatherCard forecast={forecast} />
        </div>

        <p className="order-8 flex items-center gap-2 px-1 text-xs font-medium text-ink-soft lg:justify-end">
          <Info size={14} aria-hidden="true" className="shrink-0" />
          {t('disc.guide')}
        </p>
      </div>
    </div>
  )
}