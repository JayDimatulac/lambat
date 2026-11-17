import type { ComponentType } from 'react'
import { data, Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Fish, Megaphone, UserCheck, Wallet } from 'lucide-react'
import { BuoyIcon } from '../../components/icons'
import { LostFishIcon } from '../../components/home/HomeIcons'
import BuoyRack from './BuoyRack'
import CatchOutcomes from './CatchOutcomes'
import HarborScene from './HarborScene'
import RecentActivity from './RecentActivity'
import TideChart from './TideChart'
import { Bar, Card, Head } from './ui'
import { fmtPeso, fmtTons, useAdminOverview } from '../../lib/adminApi'

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
    <Link to={to} className="group flex items-center gap-4 rounded-lg border border-line bg-card p-4 shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised">
      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${tone === 'coral' ? 'bg-coral/20 text-coral' : 'bg-seafoam text-teal'}`}>
        <Icon size={26} strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <b className="block font-numeral text-3xl font-bold leading-none">
          {value}
          {unit && <span className="ml-1 text-lg">{unit}</span>}
        </b>
        <span className="mt-1 block text-sm font-semibold text-ink-soft">{label}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${trend.good ? 'bg-risk-low-bg text-risk-low' : 'bg-risk-high-bg text-risk-high'}`}>
              <TIcon size={14} strokeWidth={2.2} aria-hidden />
              {trend.text}
            </span>
          )}
          {note}
        </span>
      </span>
    </Link>
  )
}

function Task({ to, icon: Icon, title, sub, count, urgent }: { to: string; icon: LIcon; title: string; sub: string; count?: number; urgent?: boolean }) {
  return (
    <Link to={to} className="flex min-h-16 items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 shadow-rest transition hover:-translate-y-0.5 hover:border-teal">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${urgent ? 'bg-risk-high-bg text-risk-high' : 'bg-seafoam text-teal'}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] leading-tight">{title}</b>
        <span className="block truncate text-sm text-ink-soft">{sub}</span>
      </span>
      {count !== undefined && (
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${count > 0 ? 'bg-coral text-deep' : 'bg-mint text-ink-soft'}`}>{count}</span>
      )}
      <ArrowRight size={18} strokeWidth={1.8} aria-hidden className="shrink-0 text-ink-soft" />
    </Link>
  )
}

export default function Dashboard() {
  const { data, error, loading } = useAdminOverview()
if (loading) return <p className="p-6 text-ink-soft">Loading the harbor…</p>
if (error || !data) return <p className="p-6 text-risk-high">{error ?? 'No data'}</p>
const pending = data.accountsWaiting
const urgent = data.atRisk
const lost = data.lostBySpecies
const areas = data.areas
  return (
    <div className="space-y-5">
      {/* Hero: slim, the harbor at dawn */}
      <section className="bg-dawn relative min-h-[160px] overflow-hidden rounded-lg p-5 text-white shadow-raised">
        <div className="relative z-10 max-w-lg">
          <h1 className="font-numeral text-[26px] font-semibold leading-tight">LAMBAT Operations</h1>
          <p className="mt-1 text-white/90">Monitor catches, users, buyers, and advisories across your harbor.</p>
        </div>
        <HarborScene />
      </section>

      {/* Key numbers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi to="/admin/listings" icon={Fish} label="Landed in total" value={fmtTons(data.landed.kg)} unit="t" note={`${data.landed.count} catches logged`} trend={{ up: true, good: true, text: `+${data.landed.thisWeek} this week` }} />
        <Kpi to="/admin/listings" icon={Wallet} label="Value of completed sales" value={fmtPeso(data.valueRecovered)} note="from completed orders" trend={{ up: false, good: data.lossRatePct <= 10, text: `${data.lossRatePct}% lost` }} />
        <Kpi to="/admin/verifications" icon={UserCheck} label="Accounts waiting" value={pending} note={pending === 0 ? 'All caught up' : 'need your approval'} />
        <Kpi to="/admin/listings" icon={BuoyIcon as LIcon} label="Catches at risk" value={urgent} note="high or critical" tone="coral" trend={urgent > 0 ? { up: true, good: false, text: 'act today' } : undefined} />
      </div>

      {/* Needs attention: a strip of three quick actions */}
      <section aria-label="Needs attention" className="grid gap-3 xl:grid-cols-[auto_1fr_1fr_1fr] xl:items-center">
        <div className="px-1 xl:pr-4">
          <h2 className="font-display text-xl font-bold">Needs attention</h2>
          <p className="text-sm text-ink-soft">Your queue for today</p>
        </div>
        <Task to="/admin/verifications" icon={UserCheck} title="Approve new accounts" sub={pending === 0 ? 'Nobody is waiting' : `${pending} waiting to moor`} count={pending} />
        <Task to="/admin/listings" icon={Fish} title="Check at-risk catches" sub={`${urgent} near spoilage`} count={urgent} urgent={urgent > 0} />
        <Task to="/admin/advisories" icon={Megaphone} title="Send an advisory" sub={`Last sent: ${sub={data.lastAdvisory ? `Last sent: ${new Date(data.lastAdvisory.createdAt).toLocaleDateString()}` : 'None sent yet'}n}`} />
      </section>

      {/* Weekly tide and what just happened */}
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <TideChart />
        <RecentActivity />
      </div>

      {/* Where the catch went, and how risky it is out there */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CatchOutcomes />
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