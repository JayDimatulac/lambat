import { useState } from 'react'
import { Link } from 'react-router-dom'
import CatchCard from '../components/CatchCard'
import Chip from '../components/ui/Chip'
import Button from '../components/ui/Button'
import { catches } from '../data/mock'

const filters = ['Lahat', 'Aktibo', 'Naibenta', 'Nakuha'] as const

export default function MyCatches() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Lahat')
  const shown = catches.filter((c) =>
    filter === 'Lahat' ? true : filter === 'Aktibo' ? !c.sold : filter === 'Naibenta' ? c.sold : false,
  )
  const active = catches.filter((c) => !c.sold)
  const stats = [
    { n: active.length, l: 'Aktibo' },
    { n: `${active.reduce((s, c) => s + c.kg, 0)} kg`, l: 'Kabuuan' },
    { n: active.filter((c) => c.risk === 'high' || c.risk === 'critical').length, l: 'Nanganganib' },
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[28px]">Mga Huli Ko</h2>
        <Link to="/catches/new" className="hidden lg:block"><Button>+ Itala ang Huli</Button></Link>
      </div>
      <div className="grid max-w-md grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.l} className="rounded-md border border-line bg-white p-3 text-center shadow-rest">
            <p className="font-display text-2xl font-bold">{s.n}</p>
            <p className="text-xs text-ink-soft">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => <Chip key={f} active={f === filter} onClick={() => setFilter(f)}>{f}</Chip>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((c) => <CatchCard key={c.id} c={c} />)}
      </div>
    </div>
  )
}
