import { useEffect, useState } from 'react'
import { Banknote, BarChart3, Download, Fish, MapPin, Scale, TrendingDown, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fmtPeso, fmtWeight, useAdminOverview, type AdminOverview } from '../../lib/adminApi'
import { useSettings } from '../../lib/settings'
import { localeOf } from '../../lib/time'
import { Badge, Panel, Stat, btnGhost } from './AdminBits'
import { StackedBars } from './Charts'
import { ROLE_KEY, useA } from './adminText'
import { Bar } from './ui'

type SpeciesRow = { englishName: string; localNames: string[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function exportCsv(d: AdminOverview, local: Record<string, string>) {
  const n = (v: number | undefined) => Math.round(v ?? 0)
  const rows: (string | number)[][] = [
    ['Week starting', 'Sold kg', 'Shared kg', 'Processed kg', 'Lost kg'],
    ...d.weeks.map((w) => [w.weekStart.slice(0, 10), n(w.kg.SOLD), n(w.kg.REDISTRIBUTED), n(w.kg.PROCESSED), n(w.kg.DISCARDED)]),
    [],
    ['Fish lost (local name)', 'English name', 'kg'],
    ...d.lostBySpecies.map((s) => [cap(local[s.name] ?? s.name), s.name, s.kg]),
    [],
    ['Area', 'Total kg', 'Lost kg', 'Loss %'],
    ...d.areas.map((a) => [a.name, a.kg, a.lostKg, a.lossPct]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `lambat-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const A = useA()
  const { lang } = useSettings()
  const { accounts } = useAuth()
  const { data, error, loading } = useAdminOverview()
  const [local, setLocal] = useState<Record<string, string>>({})

  // the Tagalog (local) name of each species, from the species list in the database
  useEffect(() => {
    let on = true
    api.get<{ species: SpeciesRow[] }>('/admin/shelf-life')
      .then((r) => {
        if (!on) return
        const m: Record<string, string> = {}
        for (const s of r.species) if (s.localNames?.[0]) m[s.englishName] = s.localNames[0]
        setLocal(m)
      })
      .catch(() => {})
    return () => { on = false }
  }, [])

  if (loading) return <p className="p-6 text-ink-soft">{A('c.loading')}</p>
  if (error || !data) return <p className="p-6 text-risk-high">{A('c.error')}</p>

  const loc = localeOf(lang)
  const landed = fmtWeight(data.landed.kg)
  const lost = data.lostBySpecies
  const areas = data.areas
  const roles = ['fisherfolk', 'buyer', 'organization'] as const
  const n = (v: number | undefined) => Math.round(v ?? 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => exportCsv(data, local)} className={btnGhost}><Download size={18} aria-hidden />{A('rp.export')}</button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={Scale} label={A('rp.landed')} value={landed.value} unit={landed.unit} />
        <Stat icon={Banknote} label={A('rp.value')} value={fmtPeso(data.valueRecovered)} />
        <Stat icon={TrendingDown} label={A('rp.loss')} value={`${data.lossRatePct}%`} />
        <Stat icon={Fish} label={A('rp.catches')} value={data.landed.count} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel icon={BarChart3} title={A('rp.weekly')}>
          <StackedBars
            data={data.weeks.map((w) => ({
              label: new Date(w.weekStart).toLocaleDateString(loc, { month: 'short', day: 'numeric' }),
              parts: [n(w.kg.SOLD), n(w.kg.REDISTRIBUTED), n(w.kg.PROCESSED), n(w.kg.DISCARDED)],
            }))}
            colors={['var(--color-teal)', 'var(--color-peach)', 'var(--color-risk-low-line)', 'var(--color-coral)']}
            names={[A('rp.sold'), A('rp.shared'), A('rp.processed'), A('rp.lost')]}
            unit=" kg"
            height={190}
          />
        </Panel>

        <Panel icon={Fish} title={A('rp.species')}>
          <div className="flex flex-col gap-3.5">
            {lost.length === 0 && <p className="text-sm text-ink-soft">{A('rp.none')}</p>}
            {lost.map(({ name, kg }) => {
              const lo = local[name]
              return (
                <div key={name} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 leading-tight">
                    <b className="block truncate">{cap(lo ?? name)}</b>
                    {lo && lo.toLowerCase() !== name.toLowerCase() && <span className="block truncate text-xs text-ink-soft">{name}</span>}
                  </span>
                  <Bar pct={(kg / (lost[0]?.kg || 1)) * 100} color="var(--color-coral)" />
                  <b className="w-14 text-right tabular-nums">{kg} kg</b>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={MapPin} title={A('rp.areas')}>
          <div className="flex flex-col gap-3">
            {areas.length === 0 && <p className="text-sm text-ink-soft">{A('rp.none')}</p>}
            {areas.map(({ name, lossPct }) => (
              <div key={name} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate">{name}</span>
                <Bar pct={(lossPct / (areas[0]?.lossPct || 1)) * 100} color="var(--color-teal)" />
                <b className="w-14 text-right tabular-nums">{lossPct}%</b>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={Users} title={A('rp.accounts')}>
          <ul className="divide-y divide-line">
            {roles.map((r) => {
              const all = accounts.filter((a) => a.role === r)
              const waiting = all.filter((a) => a.status === 'PENDING').length
              return (
                <li key={r} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-semibold">{A(ROLE_KEY[r])}</span>
                  <span className="flex items-center gap-3">
                    {waiting > 0 && <Badge tone="amber">{waiting} {A('rp.pending')}</Badge>}
                    <b className="font-numeral text-xl tabular-nums">{all.length}</b>
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}