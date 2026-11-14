import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, CloudSun, Info, MapPin, Sparkles, Store } from 'lucide-react'
import TideScene from '../components/tide/TideScene'
import NetTally from '../components/home/NetTally'
import ParolaPanel from '../components/home/ParolaPanel'
import WeatherCard from '../components/home/WeatherCard'
import { BangkaIcon, PennantIcon } from '../components/home/HomeIcons'
import { byUrgency, isActive, weekBase, type Outcome } from '../data/mock'
import { useCatches } from '../data/store'
import { useUser } from '../lib/auth'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'
import { localeOf } from '../lib/time'
import { hour12, useForecast, windOutlook } from '../lib/weather'

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
      icon: <CloudSun size={32} aria-hidden="true" />,
      title: filipino ? 'Tingnan ang panahon' : 'Check Weather',
      description: filipino ? 'Alamin ang kondisyon ng dagat' : 'See sea conditions',
      color: 'from-[#effbff] to-[#bce7ef]',
    },
    {
      to: '/buyers',
      icon: <Store size={32} aria-hidden="true" />,
      title: filipino ? 'Humanap ng mamimili' : 'Find Buyers',
      description: filipino ? 'Kumonekta sa mga mamimili' : 'Connect with buyers',
      color: 'from-[#ecfaf6] to-[#b8e8dd]',
    },
    {
      to: '/value-added',
      icon: <Sparkles size={32} aria-hidden="true" />,
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

        <Link
          to="/weather"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-deep/50 px-3 text-xs font-semibold text-white sm:text-sm"
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

  return (
    <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-start lg:gap-5">
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
        <div className="order-1">
          <TideScene catches={active.slice(0, 4)} header={header} />
        </div>

        <Link
          to="/catches/new"
          className="order-2 flex min-h-14 items-center gap-3 rounded-full border border-white/70 bg-linear-to-r from-[#ffb78d] via-[#ff925f] to-[#ff7946] px-2 pr-4 text-deep shadow-raised transition hover:brightness-105 active:scale-[0.98] xl:min-h-[64px]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/50">
            <BangkaIcon size={32} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-numeral text-xl font-bold leading-tight">
              {t('home.log')}
            </span>
            <span className="simple-hide block text-xs font-medium sm:text-sm">
              {t('home.log.sub')}
            </span>
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black/15 text-white">
            <ArrowRight size={21} aria-hidden="true" />
          </span>
        </Link>

        <div className="order-3 grid grid-cols-2 gap-3 sm:grid-cols-3">   
          {shortcuts.map(({ to, icon, title, description, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex min-h-[112px] flex-col items-center justify-center rounded-[24px] border border-white/80 bg-linear-to-br ${color} px-2 py-3 text-center text-deep shadow-raised transition hover:-translate-y-0.5 active:scale-[0.98] xl:min-h-[124px]`}
            >
              <span className="mb-2" aria-hidden="true">{icon}</span>
              <span className="text-sm font-bold leading-tight">{title}</span>
              <span className="simple-hide mt-1 text-xs leading-tight">{description}</span>
            </Link>
          ))}
        </div>

        <div className="order-5 lg:order-4">
          <NetTally sold={sum('sold')} shared={sum('shared')} lost={sum('lost')} />
        </div>
      </div>

      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
        <div className="order-4 lg:order-1 [&>*]:lg:min-h-[350px] [&>*]:xl:min-h-[410px] [&>*]:lg:justify-between">
          <ParolaPanel urgent={urgent} next={next} />
        </div>

        <div className="order-6 flex flex-col lg:order-2 [&>*]:lg:min-h-[330px] [&>*]:xl:min-h-[385px]">
          <WeatherCard forecast={forecast} />
        </div>

        <p className="order-7 flex items-center gap-2 px-1 text-xs font-medium text-ink-soft lg:order-3 lg:justify-end">
          <Info size={14} aria-hidden="true" className="shrink-0" />
          {t('disc.guide')}
        </p>
      </div>
    </div>
  )
}