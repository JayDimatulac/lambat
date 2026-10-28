import { useState } from 'react'
import { IceBlockIcon, IceSackIcon, TideIcon } from '../../components/icons'
import { DryRackIcon, HourglassTideIcon } from './AdminIcons'
import { SHELF_LIFE } from './data'
import { Bar, Chip, Empty, PageTitle, SearchBox } from './ui'

const MAX = 30
const COND = [
  { key: 'full', label: 'Full ice', icon: IceBlockIcon, color: 'var(--color-teal)' },
  { key: 'light', label: 'Light ice', icon: IceSackIcon, color: 'var(--color-peach)' },
  { key: 'none', label: 'No ice', icon: TideIcon, color: 'var(--color-coral)' },
] as const

export default function Reference() {
  const [q, setQ] = useState('')
  const rows = SHELF_LIFE.filter((r) => `${r.fish} ${r.value}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <PageTitle title="Shelf life" sub="How many hours each fish stays good to sell, by how it is iced. The estimator reads these." />
      <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search fish or product" /></div>
      {rows.length === 0 ? (
        <Empty icon={HourglassTideIcon} title="No fish found" sub="Try another name." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={r.fish} className="anim-rise rounded-lg border border-line bg-card p-4 shadow-rest transition hover:shadow-raised">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-numeral text-2xl font-bold leading-tight">{r.fish}</h3>
                <Chip tone="info"><DryRackIcon size={16} />{r.value}</Chip>
              </div>
              <div className="space-y-2.5">
                {COND.map((c) => (
                  <div key={c.key} className="flex items-center gap-2.5 text-sm">
                    <span className="flex w-24 shrink-0 items-center gap-1.5"><c.icon size={20} className="text-teal" />{c.label}</span>
                    <Bar pct={(r[c.key] / MAX) * 100} color={c.color} />
                    <b className="w-10 text-right">{r[c.key]} h</b>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs italic text-ink-soft">Estimate only. Not a food-safety test.</p>
    </div>
  )
}