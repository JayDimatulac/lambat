import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BuoyIcon, FishIcon } from '../../components/icons'
import { LostFishIcon, SharedFishIcon, SoldFishIcon } from '../../components/home/HomeIcons'
import { useAuth, useUser } from '../../lib/auth'
import { BudyongIcon, CoinWaveIcon, DryRackIcon, MooringIcon, ScaleIcon } from './AdminIcons'
import HarborScene from './HarborScene'
import { Bar, Card, Head, RiskBuoy, RiskTag, type Icon } from './ui'
import { KPIS, LISTINGS, OUTCOMES, RISK_MIX, SENT, SPECIES, TOWNS, WEEKS, type Kpi } from './data'

const KPI_ICON: Record<Kpi['icon'], Icon> = { fish: FishIcon, scale: ScaleIcon, sold: SoldFishIcon, shared: SharedFishIcon, lost: LostFishIcon, coin: CoinWaveIcon }
const OUTCOME_ICON: Icon[] = [SoldFishIcon, SharedFishIcon, DryRackIcon, LostFishIcon]
const MAX = 2500

export default function Dashboard() {
  const user = useUser()
  const { accounts } = useAuth()
  const [range, setRange] = useState<'4' | '8'>('8')
  const [pick, setPick] = useState(WEEKS[WEEKS.length - 1].label)

  const pending = accounts.filter((a) => a.role !== 'admin' && a.status === 'PENDING').length
  const urgent = LISTINGS.filter((l) => l.risk === 'crit' || l.risk === 'high').length
  const weeks = range === '4' ? WEEKS.slice(-4) : WEEKS
  const week = weeks.find((w) => w.label === pick) ?? weeks[weeks.length - 1]
  const total = week.kg.reduce((a, b) => a + b, 0)

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k) => {
          const I = KPI_ICON[k.icon]
          return (
            <Card key={k.label} className="anim-rise !p-4">
              <I size={28} className={k.tone === 'loss' ? 'text-risk-high' : 'text-teal'} />
              <b className={`mt-2 block font-numeral text-3xl font-bold leading-tight ${k.tone === 'loss' ? 'text-risk-high' : k.tone === 'good' ? 'text-teal' : ''}`}>{k.value}</b>
              <span className="text-sm font-semibold">{k.label}</span>
              <small className="block text-xs text-ink-soft">{k.sub}</small>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <Head title="What happened to the catches" sub="Tap a week to see its breakdown, in kg"
            right={
              <div role="radiogroup" aria-label="Range" className="inline-flex rounded-full border border-line bg-seafoam/50 p-1">
                {(['4', '8'] as const).map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={range === r} onClick={() => setRange(r)}
                    className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${range === r ? 'bg-teal text-on-accent shadow-rest' : 'hover:bg-seafoam'}`}>{r} weeks</button>
                ))}
              </div>
            } />
          <div className="flex h-56 items-end gap-1.5 border-b border-line">
            {weeks.map((w) => (
              <button key={w.label} type="button" aria-pressed={w.label === week.label} aria-label={`${w.label}: ${w.kg.reduce((a, b) => a + b, 0)} kg`} onClick={() => setPick(w.label)}
                className="flex h-full flex-1 flex-col-reverse gap-px rounded-sm p-0.5 transition hover:bg-seafoam/60 aria-pressed:bg-seafoam">
                {w.kg.map((v, j) => <div key={j} className="rounded-sm transition-[height] duration-500" style={{ height: `${(v / MAX) * 100}%`, background: OUTCOMES[j].color }} />)}
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5">{weeks.map((w) => <span key={w.label} className={`flex-1 text-center text-[11px] ${w.label === week.label ? 'font-bold text-teal' : 'text-ink-soft'}`}>{w.label}</span>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {OUTCOMES.map((o, i) => {
              const I = OUTCOME_ICON[i]
              return (
                <div key={o.name} className="rounded-md bg-mint p-3">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold"><I size={20} />{o.name}</span>
                  <b className="mt-1 block font-numeral text-xl leading-tight">{week.kg[i].toLocaleString('en-PH')} kg</b>
                  <small className="text-xs text-ink-soft">{Math.round((week.kg[i] / total) * 100)}% of {week.label}</small>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <Head icon={BuoyIcon} title="Risk right now" sub="Active catches, by how low they float" />
          <div className="flex flex-col gap-3">
            {RISK_MIX.map(([r, pct, c]) => (
              <div key={r} className="flex items-center gap-2.5">
                <span className="w-32 shrink-0"><RiskTag risk={r} /></span>
                <Bar pct={pct} color={c} />
                <b className="w-11 text-right text-sm">{pct}%</b>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs italic text-ink-soft">Estimate only. Not a food-safety test.</p>
        </Card>
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