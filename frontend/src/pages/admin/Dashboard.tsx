import { Card, CardHead, Badge, Bar } from './ui'
import { KPIS, WEEKS, OUTCOME_NAMES, OUTCOME_COLORS, RISK, SPECIES, TOWNS } from './data'
import { useOutletContext } from 'react-router-dom'
import type { Ctx } from './data'

const MAX = 2500
export default function Dashboard() {
  const { accounts } = useOutletContext<Ctx>()
  const pending = accounts.filter(a => a.status === 'pend').length
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-ink-soft">{pending} account na naghihintay ng verification</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {KPIS.map(([v, l, s, tone]) => (
          <Card key={l}>
            <b className={`block font-numeral text-3xl font-bold leading-tight ${tone === 'loss' ? 'text-risk-high' : tone === 'good' ? 'text-teal' : ''}`}>{v}</b>
            <span className="text-sm font-semibold">{l}</span><small className="block text-xs text-ink-soft">{s}</small>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHead title="Kinalabasan ng mga huli" sub="Outcome per week, in kg · last 8 weeks" />
          <div className="flex h-56 items-end gap-2 border-b border-line">
            {WEEKS.map(w => (
              <div key={w.label} className="flex h-full flex-1 flex-col-reverse gap-px" title={w.label}>
                {w.kg.map((v, j) => <div key={j} title={`${w.label} · ${OUTCOME_NAMES[j]}: ${v} kg`} className="rounded-sm" style={{ height: `${(v / MAX) * 100}%`, background: OUTCOME_COLORS[j] }} />)}
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-2">{WEEKS.map(w => <span key={w.label} className="flex-1 text-center text-[11px] text-ink-soft">{w.label}</span>)}</div>
          <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
            {OUTCOME_NAMES.map((n, i) => <span key={n}><i className="mr-1.5 inline-block size-2.5 rounded-full" style={{ background: OUTCOME_COLORS[i] }} />{n}</span>)}
          </div>
        </Card>
        <Card>
          <CardHead title="Antas ng panganib" sub="Active catches right now" />
          <div className="flex flex-col gap-2.5">
            {RISK.map(([r, pct, c]) => <div key={r} className="flex items-center gap-2.5"><span className="w-28"><Badge risk={r} /></span><Bar pct={pct} color={c} /><b className="w-12 text-right text-sm">{pct}%</b></div>)}
          </div>
          <p className="mt-4 text-xs italic text-ink-soft">Estimate only. Not a food-safety test.</p>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHead title="Mga isdang pinakanasasayang" sub="Recorded loss by species" />
          <div className="flex flex-col gap-2.5">{SPECIES.map(([n, kg]) => <div key={n} className="flex items-center gap-2.5 text-sm"><span className="w-28">{n}</span><Bar pct={(kg / SPECIES[0][1]) * 100} color="var(--color-coral)" /><b className="w-16 text-right">{kg} kg</b></div>)}</div>
        </Card>
        <Card>
          <CardHead title="Mga bayan na dapat bantayan" sub="Loss rate by landing area" />
          <div className="flex flex-col gap-2.5">{TOWNS.map(([n, p]) => <div key={n} className="flex items-center gap-2.5 text-sm"><span className="w-28">{n}</span><Bar pct={(p / TOWNS[0][1]) * 100} color="var(--color-teal)" /><b className="w-16 text-right">{p}%</b></div>)}</div>
        </Card>
      </div>
    </div>
  )
}