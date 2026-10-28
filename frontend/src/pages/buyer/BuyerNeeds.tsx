import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Minus, Plus } from 'lucide-react'
import Sheet from '../../components/ui/Sheet'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Segmented from '../../components/ui/Segmented'
import { KnotPlusIcon } from '../../components/icons'
import { BASE_PRICE } from '../../lib/buyers'
import { useUser } from '../../lib/auth'
import { openListings, useMarket, type Need } from '../../lib/market'
import { useBT } from '../../lib/buyerText'

type When = Need['when']
const FISH = Object.keys(BASE_PRICE)

const Stepper = ({ value, onChange, step, min, max, fmt }: { value: number; onChange: (n: number) => void; step: number; min: number; max: number; fmt: (n: number) => string }) => (
  <div className="flex items-center justify-between gap-3 rounded-md bg-mint p-3">
    <button type="button" aria-label={`-${step}`} onClick={() => onChange(Math.max(min, value - step))} className="grid size-12 place-items-center rounded-full border-2 border-teal text-teal"><Minus size={22} strokeWidth={2} aria-hidden /></button>
    <p className="font-numeral text-3xl font-extrabold text-teal">{fmt(value)}</p>
    <button type="button" aria-label={`+${step}`} onClick={() => onChange(Math.min(max, value + step))} className="grid size-12 place-items-center rounded-full border-2 border-teal text-teal"><Plus size={22} strokeWidth={2} aria-hidden /></button>
  </div>
)

export default function BuyerNeeds() {
  const b = useBT()
  const user = useUser()
  const m = useMarket()
  const [params, setParams] = useSearchParams()
  const [fish, setFish] = useState(FISH[0])
  const [kg, setKg] = useState(20)
  const [when, setWhen] = useState<When>('today')
  const [max, setMax] = useState(0)

  const mine = m.needs.filter((n) => n.buyerId === user.id)
  const open = openListings(m)
  const close = () => setParams({})

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px]">{b('needs.title')}</h1>
          <p className="text-ink-soft">{b('needs.sub')}</p>
        </div>
        <button type="button" onClick={() => setParams({ new: '1' })} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-coral px-4 text-sm font-semibold text-deep"><KnotPlusIcon size={20} />{b('needs.new')}</button>
      </div>

      {mine.length === 0 ? <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{b('needs.empty')}</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.map((n) => {
            const k = open.filter((l) => l.species === n.species && (!n.maxPrice || l.ask <= n.maxPrice)).length
            return (
              <article key={n.id} className={`space-y-3 rounded-lg border bg-card p-4 shadow-rest ${n.open ? 'border-line' : 'border-line opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-numeral text-xl font-bold">{n.species}</h3>
                    <p className="text-sm text-ink-soft">{b('needs.line', { kg: n.kg, when: b(`when.${n.when}` as 'when.today') })}{n.maxPrice ? ` · ${b('needs.upto', { n: n.maxPrice })}` : ''}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${!n.open ? 'bg-mint text-ink-soft' : k ? 'bg-seafoam text-teal' : 'bg-mint text-ink-soft'}`}>{!n.open ? b('needs.closed') : k ? b('home.needs.match', { n: k }) : b('home.needs.nomatch')}</span>
                </div>
                {n.open && (
                  <div className="flex flex-wrap gap-2">
                    {k > 0 && <Link to="/buyer/offers" className="inline-flex min-h-12 items-center rounded-full bg-coral px-4 text-sm font-semibold text-deep">{b('needs.view')}</Link>}
                    <button type="button" onClick={() => m.closeNeed(n.id)} className="min-h-12 rounded-full border-2 border-line px-4 text-sm font-semibold">{b('needs.close')}</button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <Sheet open={params.get('new') === '1'} onClose={close} title={b('needs.new')}>
        <div className="space-y-2">
          <p className="font-semibold">{b('needs.fish')}</p>
          <div className="flex flex-wrap gap-2">{FISH.map((f) => <Chip key={f} active={fish === f} onClick={() => setFish(f)}>{f}</Chip>)}</div>
        </div>
        <div className="space-y-2"><p className="font-semibold">{b('needs.kg')}</p><Stepper value={kg} onChange={setKg} step={5} min={5} max={500} fmt={(n) => `${n} kg`} /></div>
        <div className="space-y-2">
          <p className="font-semibold">{b('needs.when')}</p>
          <Segmented<When> label={b('needs.when')} value={when} onChange={setWhen} options={[{ value: 'today', label: b('when.today') }, { value: 'tomorrow', label: b('when.tomorrow') }, { value: 'week', label: b('when.week') }]} />
        </div>
        <div className="space-y-2"><p className="font-semibold">{b('needs.max')}</p><Stepper value={max} onChange={setMax} step={5} min={0} max={500} fmt={(n) => (n ? `₱${n}` : b('needs.nomax'))} /></div>
        <Button className="min-h-14 w-full text-base" onClick={() => { m.addNeed({ buyerId: user.id, species: fish, kg, when, maxPrice: max || undefined }); close() }}>{b('needs.post')}</Button>
      </Sheet>
    </div>
  )
}