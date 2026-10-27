import { Link } from 'react-router-dom'
import TideScene from '../components/tide/TideScene'
import NetTally from '../components/home/NetTally'
import ParolaPanel from '../components/home/ParolaPanel'
import { BangkaIcon, BuoyIcon, PennantIcon, WaveArrow } from '../components/home/HomeIcons'
import { byUrgency, isActive, weekBase, type Outcome } from '../data/mock'
import { useCatches } from '../data/store'
import { useUser } from '../lib/auth'
import { localeOf } from '../lib/time'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'

export default function Dashboard() {
  const t = useT()
  const { lang } = useSettings()
  const { catches } = useCatches()
  const user = useUser()
  const place = user.fisher?.landing ?? user.barangay
  const now = new Date()
  const hour = now.getHours()
  const greet = hour < 12 ? t('greet.morning') : hour < 18 ? t('greet.afternoon') : t('greet.evening')
  const date = now.toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric' })

  const active = catches.filter(isActive).sort(byUrgency)
  const urgent = active.filter((c) => c.risk === 'high' || c.risk === 'critical').slice(0, 2)
  const next = active.find((c) => !urgent.includes(c))

  const sum = (o: Outcome) => {
    const closed = catches.filter((c) => c.outcome === o)
    const base = user.demo ? weekBase[o] : { n: 0, kg: 0 } // only the demo fisher starts with earlier weeks
    return { n: base.n + closed.length, kg: base.kg + closed.reduce((total, c) => total + c.kg, 0) }
  }

  const header = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="pt-2">
          <p className="text-sm font-medium text-white">{date}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-white">
            <BuoyIcon size={16} />
            {place}
          </p>
        </div>
        <Link to="/weather" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-deep/40 px-3.5 text-sm font-semibold text-white">
          <PennantIcon size={18} />
          {t('home.wind')}
        </Link>
      </div>
      <p className="mt-1 font-numeral text-[24px] font-bold leading-tight text-white">
        {greet}, {user.shortName}
      </p>
    </>
  )

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
      {/* 1. THE SEA, AND THE ONE ACTION: a compact bar, the boat coming in */}
      <div className="space-y-4 lg:col-start-1 lg:row-start-1">
        <TideScene catches={active.slice(0, 4)} header={header} />
        <Link
          to="/catches/new"
          className="relative flex h-14 items-center gap-3 overflow-hidden rounded-full bg-coral pl-1.5 pr-4 text-deep shadow-raised transition active:scale-[0.98]"
        >
          <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-cream">
            <span className="anim-ripple absolute inset-0 rounded-full border-2 border-deep/30" aria-hidden="true" />
            <BangkaIcon size={30} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-numeral text-xl font-bold leading-none">{t('home.log')}</span>
            <span className="simple-hide mt-1 block truncate text-xs font-medium">{t('home.log.sub')}</span>
          </span>
          <WaveArrow size={24} />
        </Link>
      </div>

      {/* 2. THE PAROLA: needs action */}
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <ParolaPanel urgent={urgent} next={next} />
      </div>

      {/* 3. THIS WEEK: THE NET */}
      <div className="lg:col-start-1 lg:row-start-2">
        <NetTally sold={sum('sold')} shared={sum('shared')} lost={sum('lost')} />
      </div>
    </div>
  )
}