import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { IceBlockIcon, IceSackIcon, TideIcon } from '../../components/icons'
import { DryRackIcon, HourglassTideIcon } from './AdminIcons'
import { Bar, Chip, Empty, PageTitle, SearchBox } from './ui'

type Level = 'plenty' | 'good' | 'fair' | 'low' | 'none'
type Row = {
  id: string
  englishName: string
  localNames: string[]
  histamine: boolean
  products: string[]
  levels: { level: Level; tempC: number; minHours: number; maxHours: number }[] | null
}
type Reply = { placeholder: boolean; species: Row[] }

// best-iced first, so the bars shrink down the card
const COND: { key: Level; label: string; icon: typeof IceBlockIcon; color: string }[] = [
  { key: 'plenty', label: 'Plenty of ice', icon: IceBlockIcon, color: 'var(--color-teal)' },
  { key: 'good', label: 'Good ice', icon: IceBlockIcon, color: 'color-mix(in srgb, var(--color-teal) 60%, white)' },
  { key: 'fair', label: 'Some ice', icon: IceSackIcon, color: 'var(--color-peach)' },
  { key: 'low', label: 'Little ice', icon: IceSackIcon, color: 'color-mix(in srgb, var(--color-coral) 55%, white)' },
  { key: 'none', label: 'No ice', icon: TideIcon, color: 'var(--color-coral)' },
]

const hrs = (lo: number, hi: number) => {
  const a = Math.round(lo)
  const b = Math.round(hi)
  return a === b ? `${a} h` : `${a}–${b} h`
}

export default function Reference() {
  const [q, setQ] = useState('')
  const [data, setData] = useState<Reply | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Reply>('/admin/shelf-life')
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load shelf life'))
  }, [])

  if (error) return <p className="p-6 text-risk-high">{error}</p>
  if (data === null) return <p className="p-6 text-ink-soft">Loading shelf life…</p>

  // every bar uses one scale, so two fish can be compared at a glance
  const scale = Math.max(1, ...data.species.flatMap((s) => (s.levels ?? []).map((l) => l.minHours)))
  const needle = q.trim().toLowerCase()
  const rows = data.species.filter((r) => `${r.englishName} ${r.localNames.join(' ')} ${r.products.join(' ')}`.toLowerCase().includes(needle))

  return (
    <div>
      <PageTitle title="Shelf life" sub="How many hours each fish stays good to sell, by how much ice it has. The estimator uses these exact numbers." />
      {data.placeholder && (
        <div className="mb-4"><Chip tone="warn">Placeholder values. Not yet backed by a cited source.</Chip></div>
      )}
      <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search fish, local name or product" /></div>
      {rows.length === 0 ? (
        <Empty icon={HourglassTideIcon} title="No fish found" sub="Try another name." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={r.id} className="anim-rise rounded-lg border border-line bg-card p-4 shadow-rest transition hover:shadow-raised">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-numeral text-2xl font-bold leading-tight">{r.englishName}</h3>
                {r.products.length > 0 && <Chip tone="info"><DryRackIcon size={16} />{r.products.slice(0, 2).join(', ')}</Chip>}
              </div>
              <p className="mb-3 text-sm text-ink-soft">
                {r.localNames.length > 0 ? r.localNames.join(', ') : 'No local name saved'}
                {r.histamine && ' · histamine risk, so the cautious number is used'}
              </p>
              {r.levels === null ? (
                <p className="text-sm text-ink-soft">No shelf-life data for this fish yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {COND.map((c) => {
                    const l = r.levels?.find((x) => x.level === c.key)
                    if (!l) return null
                    return (
                      <div key={c.key} className="flex items-center gap-2.5 text-sm">
                        <span className="flex w-32 shrink-0 items-center gap-1.5"><c.icon size={20} className="text-teal" />{c.label}</span>
                        <Bar pct={(l.minHours / scale) * 100} color={c.color} />
                        <b className="w-20 text-right">{hrs(l.minHours, l.maxHours)}</b>
                      </div>
                    )
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs italic text-ink-soft">Estimate only. Not a food-safety test. Bars show the cautious number.</p>
    </div>
  )
}