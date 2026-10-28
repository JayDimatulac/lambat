import { Link } from 'react-router-dom'
import { BuoyIcon } from '../../components/icons'
import { LostFishIcon } from '../../components/home/HomeIcons'
import { useAuth, useUser } from '../../lib/auth'
import { BudyongIcon, MooringIcon } from './AdminIcons'
import BuoyRack from './BuoyRack'
import CatchFish from './CatchFish'
import HarborScene from './HarborScene'
import TideChart from './TideChart'
import { Bar, Card, Head, RiskBuoy } from './ui'
import { LISTINGS, SENT, SPECIES, TOWNS } from './data'

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
      <section className="bg-dawn relative overflow-hidden rounded-lg p-5 pb-36 text-white shadow-raised sm:pb-40">
        <p className="text-sm font-medium text-white/90">{date}</p>
        <h1 className="mt-1 font-numeral text-[30px] font-bold leading-tight">{greet}, {user.shortName}</h1>
        <p className="mt-1 max-w-md text-white/90">Here is how the harbor looks today.</p>
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          <Link to="/admin/verifications" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card/90 px-4 text-sm font-semibold text-navy">
            <MooringIcon size={20} className="text-teal" />{pending} waiting to moor
          </Link>
          <Link to="/admin/listings" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card/90 px-4 text-sm font-semibold text-navy">
            <RiskBuoy risk="high" size={20} />{urgent} catches near spoilage
          </Link>
        </div>
        <HarborScene />
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <Link to="/admin/verifications" className="flex items-center gap-4 rounded-lg border border-line bg-card p-4 shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><MooringIcon size={30} /></span>
          <span><b className="block font-numeral text-3xl leading-none">{pending}</b><span className="text-sm text-ink-soft">accounts waiting for approval</span></span>
        </Link>
        <Link to="/admin/listings" className="flex items-center gap-4 rounded-lg border border-line bg-card p-4 shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-risk-high-bg text-risk-high"><RiskBuoy risk="high" size={30} /></span>
          <span><b className="block font-numeral text-3xl leading-none">{urgent}</b><span className="text-sm text-ink-soft">catches at high or critical risk</span></span>
        </Link>
        <Link to="/admin/advisories" className="flex items-center gap-4 rounded-lg border border-line bg-card p-4 shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><BudyongIcon size={30} /></span>
          <span><b className="block font-numeral text-xl leading-tight">Send an advisory</b><span className="text-sm text-ink-soft">Last sent: {SENT[0].when}</span></span>
        </Link>
      </div>

      <CatchFish />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <TideChart />
        <BuoyRack />
      </div>

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