import { Link } from 'react-router-dom'
import { Waves, CloudSun, Sparkles, Settings, Store } from 'lucide-react'
import CatchCard from '../components/CatchCard'
import { catches } from '../data/mock'

const quick = [
  { to: '/weather', title: 'Panahon', sub: 'Check conditions', icon: CloudSun, cls: 'bg-seafoam text-teal border-line' },
  { to: '/buyers', title: 'Mamimili', sub: 'Find buyers', icon: Store, cls: 'bg-ice text-teal border-line' },
  { to: '/value-added', title: 'Pagpapalaki ng Halaga', sub: 'Potential pathways', icon: Sparkles, cls: 'bg-mint text-teal border-line' },
  { to: '/settings', title: 'Mga Setting', sub: 'Account & app', icon: Settings, cls: 'bg-white text-navy border-line' },
]

export default function Dashboard() {
  const active = catches.filter((c) => !c.sold)
  return (
    <div className="space-y-6">
      <section className="bg-dawn rounded-md p-6 text-white">
        <p className="text-sm text-white/70">Lunes, Setyembre 28</p>
        <h2 className="mt-1 text-[28px] font-semibold leading-tight">Magandang araw, Mang Ramon</h2>
        <p className="mt-1 text-sm text-white/80">{active.length} catches being watched today</p>
      </section>

      <div className="flex items-start gap-3 rounded-md border border-risk-high-line/50 bg-risk-high-bg p-4">
        <Waves className="mt-0.5 text-coral" size={22} strokeWidth={1.8} aria-hidden />
        <div>
          <p className="font-semibold text-risk-high">Strong wind warning in your area.</p>
          <p className="text-sm text-ink-soft">Until 6:00 PM · For planning only.</p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl">Mga Aktibong Huli</h2>
          <Link to="/catches" className="text-sm font-semibold text-teal">Lahat</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((c) => <CatchCard key={c.id} c={c} />)}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quick.map(({ to, title, sub, icon: Icon, cls }) => (
          <Link key={to} to={to} className={`rounded-md border p-3 ${cls}`}>
            <Icon size={22} strokeWidth={1.8} aria-hidden />
            <p className="mt-2 text-sm font-semibold leading-tight">{title}</p>
            <p className="text-xs text-ink-soft">{sub}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}