import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Fish, Megaphone, UserCheck, Wallet } from 'lucide-react'
import { BuoyIcon } from '../../components/icons'
import { LostFishIcon } from '../../components/home/HomeIcons'
import { useAuth, useUser } from '../../lib/auth'
import BuoyRack from './BuoyRack'
import CatchOutcomes from './CatchOutcomes'
import HarborScene from './HarborScene'
import TideChart from './TideChart'
import { Bar, Card, Head, RiskBuoy } from './ui'
import { LISTINGS, SENT, SPECIES, TOWNS } from './data'

type LIcon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

function Kpi({
  to,
  icon: Icon,
  label,
  value,
  unit,
  note,
  trend,
  tone = 'teal',
}: {
  to: string
  icon: LIcon
  label: string
  value: string | number
  unit?: string
  note: string
  trend?: { up: boolean; text: string; good: boolean }
  tone?: 'teal' | 'coral'
}) {
  const TIcon = trend?.up ? ArrowUpRight : ArrowDownRight
  return (
    <Link to={to} className="group rounded-lg border border-line bg-card p-4 shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-soft">{label}</span>
        <span className={`grid size-10 place-items-center rounded-full ${tone === 'coral' ? 'bg-coral/20 text-coral' : 'bg-seafoam text-teal'}`}>
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-2 font-numeral text-3xl font-bold leading-none">
        {value}
        {unit && <span className="ml-1 text-lg">{unit}</span>}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${trend.good ? 'bg-risk-low-bg text-risk-low' : 'bg-risk-high-bg text-risk-high'}`}>
            <TIcon size={14} strokeWidth={2.2} aria-hidden />
            {trend.text}
          </span>
        )}
        {note}
      </p>
    </Link>
  )
}

function Task({ to, icon: Icon, title, sub, count, urgent }: { to: string; icon: LIcon; title: string; sub: string; count?: number; urgent?: boolean }) {
  return (
    <Link to={to} className="flex min-h-16 items-center gap-3 rounded-xl border border-line bg-mint px-3 py-2.5 transition hover:bg-seafoam">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${urgent ? 'bg-risk-high-bg text-risk-high' : 'bg-card text-teal'}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] leading-tight">{title}</b>
        <span className="block truncate text-sm text-ink-soft">{sub}</span>
      </span>
      {count !== undefined && (
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${count > 0 ? 'bg-coral text-deep' : 'bg-card text-ink-soft'}`}>{count}</span>
      )}
      <ArrowRight size={18} strokeWidth={1.8} aria-hidden className="shrink-0 text-ink-soft" />
    </Link>
  )
}

export default function Dashboard() {
  const user = useUser()
  const { accounts } = useAuth()

  const pending = accounts.filter((a) => a.role !== 'admin' && a.status === 'PENDING').length
  const urgent = LISTINGS.filter((l) => l.risk === 'crit' || l.risk === 'high').length

  const now = new Date()
  const hour = now.getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const date = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-5">
      {/* Hero: the harbor today */}
      <section className="bg-dawn relative overflow-hidden rounded-lg p-5 pb-36 text-white shadow-raised sm:pb-40">
        <p className="text-sm font-medium text-white/90">{date}</p>
        <h1 className="mt-1 font-numeral text-[30px] font-bold leading-tight">{greet}, {user.shortName}</h1>
        <p className="mt-1 max-w-md text-white/90">Here is how the harbor looks today.</p>
        <HarborScene />
      </section>

      {/* Key numbers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi to="/admin/listings" icon={Fish} label="Landed in total" value="18.6" unit="t" note="1,284 catches logged" trend={{ up: true, good: true, text: '+112 this week' }} />
        <Kpi to="/admin/listings" icon={Wallet} label="Value recovered" value="₱412k" note="from fish that would have spoiled" trend={{ up: true, good: true, text: '10% lost' }} />
        <Kpi to="/admin/verifications" icon={UserCheck} label="Accounts waiting" value={pending} note={pending === 0 ? 'All caught up' : 'need your approval'} />
        <Kpi to="/admin/listings" icon={BuoyIcon as LIcon} label="Catches at risk" value={urgent} note="high or critical" tone="coral" trend={urgent > 0 ? { up: true, good: false, text: 'act today' } : undefined} />
      </div>

      {/* Weekly volume and outcomes */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <TideChart />
        <CatchOutcomes />
      </div>

      {/* What to do now, and how risky it is out there */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-card p-5 shadow-rest">
          <h2 className="font-display text-xl font-bold">Needs attention</h2>
          <p className="mb-3 text-sm text-ink-soft">Your queue for today</p>
          <div className="flex flex-col gap-2.5">
            <Task to="/admin/verifications" icon={UserCheck} title="Approve new accounts" sub={pending === 0 ? 'Nobody is waiting' : `${pending} waiting to moor`} count={pending} />
            <Task to="/admin/listings" icon={Fish} title="Check at-risk catches" sub={`${urgent} near spoilage`} count={urgent} urgent={urgent > 0} />
            <Task to="/admin/advisories" icon={Megaphone} title="Send an advisory" sub={`Last sent: ${SENT[0].when}`} />
          </div>
        </section>
        <BuoyRack />
      </div>

      {/* Where the losses are */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Head icon={LostFishIcon} title="Fish lost the most" sub="Recorded loss by species" />
          <div className="flex flex-col gap-2.5">
            {SPECIES.map(([n, kg]) => (
              <div key={n} className="flex items-center gap-2.5 text-sm">
                <span className="w-28 shrink-0">{n}</span>
                <Bar pct={(kg / SPECIES[0][1]) * 100} color="var(--color-coral)" />
                <b className="w-16 text-right">{kg} kg</b>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Head icon={BuoyIcon} title="Landing areas to watch" sub="Loss rate by town" />
          <div className="flex flex-col gap-2.5">
            {TOWNS.map(([n, p]) => (
              <div key={n} className="flex items-center gap-2.5 text-sm">
                <span className="w-28 shrink-0">{n}</span>
                <Bar pct={(p / TOWNS[0][1]) * 100} color="var(--color-teal)" />
                <b className="w-16 text-right">{p}%</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}