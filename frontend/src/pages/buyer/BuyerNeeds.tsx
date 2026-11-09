import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { Minus, Plus, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Segmented from '../../components/ui/Segmented'
import { KnotPlusIcon } from '../../components/icons'
import { BASE_PRICE } from '../../lib/buyers'
import { useUser } from '../../lib/auth'
import { openListings, useMarket, type Need } from '../../lib/market'
import { useBT } from '../../lib/buyerText'
import { useT } from '../../lib/i18n'
import { TOWNS, townOf } from '../../lib/geo'

type When = Need['when']
const FISH = Object.keys(BASE_PRICE)

const MAX_KG = 100
const MAX_PRICE = 100000

/* A number you can tap and type, or nudge with - and +. The typed value is checked when you leave the field. */
const Stepper = ({ value, onChange, step, min, max, prefix = '', suffix = '', emptyLabel = '', label }: {
  value: number
  onChange: (n: number) => void
  step: number
  min: number
  max: number
  prefix?: string
  suffix?: string
  emptyLabel?: string // shown when the value is 0, like "No limit"
  label: string
}) => {
  const [text, setText] = useState<string | null>(null) // null means the buyer is not typing
  const shown = text ?? (value ? String(value) : '')

  const commit = () => {
    if (text === null) return
    const n = parseInt(text, 10)
    if (!text || Number.isNaN(n)) onChange(min === 0 ? 0 : value) // empty: no limit, or keep the old value
    else onChange(Math.min(max, Math.max(min, n)))
    setText(null)
  }
  const bump = (next: number) => {
    setText(null)
    onChange(Math.min(max, Math.max(min, next)))
  }

  const btn = 'grid size-12 shrink-0 place-items-center rounded-full border-2 border-teal text-teal'
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-mint p-3">
      <button type="button" aria-label={`-${step}`} onClick={() => bump(value - step)} className={btn}>
        <Minus size={22} strokeWidth={2} aria-hidden />
      </button>

      <label className="flex min-w-0 flex-1 items-center justify-center gap-1 font-numeral text-3xl font-extrabold text-teal">
        {shown && prefix}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={label}
          value={shown}
          placeholder={emptyLabel}
          maxLength={String(max).length}
          onFocus={(e) => { setText(value ? String(value) : ''); e.currentTarget.select() }}
          onChange={(e) => setText(e.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          style={{ width: `${shown ? shown.length : Math.max(emptyLabel.length, 1)}ch` }}
          className="max-w-full bg-transparent text-center outline-none placeholder:text-teal/60"
        />
        {shown && suffix}
      </label>

      <button type="button" aria-label={`+${step}`} onClick={() => bump(value + step)} className={btn}>
        <Plus size={22} strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}

/* A modal in the middle of the screen. Click outside or press Esc to close. */
function CenterModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const t = useT()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-deep/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-rise max-h-[90dvh] w-full max-w-md space-y-6 overflow-y-auto rounded-3xl border border-line bg-card p-5 shadow-raised"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('menu.close')} className="grid size-11 place-items-center rounded-full hover:bg-seafoam">
            <X size={24} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default function BuyerNeeds() {
  const b = useBT()
  const user = useUser()
  const m = useMarket()
  const [params, setParams] = useSearchParams()
  const [fish, setFish] = useState(FISH[0])
  const [kg, setKg] = useState(20)
  const [when, setWhen] = useState<When>('today')
  const [max, setMax] = useState(0)
  const [place, setPlace] = useState(townOf(user.barangay))

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
            const waiting = m.offers.filter((o) => o.needId === n.id && o.status === 'pending')
            const accepted = m.offers.find((o) => o.needId === n.id && o.status === 'accepted')
            return (
              <article key={n.id} className={`space-y-3 rounded-lg border bg-card p-4 shadow-rest ${n.open || accepted ? 'border-line' : 'border-line opacity-60'}`}>
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

                {/* Offers from fisherfolk who have this fish */}
                {waiting.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-seafoam p-3">
                    <p className="text-sm font-semibold">
                      {o.fisher} · {o.kg} kg · ₱{o.price}/kg <span className="font-normal text-ink-soft">({o.place})</span>
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => m.answerOffer(o.id, true)} className="min-h-11 rounded-full bg-coral px-4 text-sm font-semibold text-deep">Accept</button>
                      <button type="button" onClick={() => m.answerOffer(o.id, false)} className="min-h-11 rounded-full border-2 border-line px-4 text-sm font-semibold">Decline</button>
                    </div>
                  </div>
                ))}
                {accepted && (
                  <Link to="/buyer/orders" className="block rounded-md bg-seafoam p-3 text-sm font-semibold text-teal">
                    Offer accepted from {accepted.fisher}. See it in Orders.
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      )}

      <CenterModal open={params.get('new') === '1'} onClose={close} title={b('needs.new')}>
        <div className="space-y-2">
          <p className="font-semibold">{b('needs.fish')}</p>
          <div className="flex flex-wrap gap-2">{FISH.map((f) => <Chip key={f} active={fish === f} onClick={() => setFish(f)}>{f}</Chip>)}</div>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">{b('needs.kg')}</p>
          <Stepper value={kg} onChange={setKg} step={5} min={5} max={MAX_KG} suffix=" kg" label={b('needs.kg')} />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Where are you?</p>
          <div className="flex flex-wrap gap-2">{TOWNS.map((tn) => <Chip key={tn} active={place === tn} onClick={() => setPlace(tn)}>{tn}</Chip>)}</div>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">{b('needs.when')}</p>
          <Segmented<When> label={b('needs.when')} value={when} onChange={setWhen} options={[{ value: 'today', label: b('when.today') }, { value: 'tomorrow', label: b('when.tomorrow') }, { value: 'week', label: b('when.week') }]} />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">{b('needs.max')}</p>
          <Stepper value={max} onChange={setMax} step={5} min={0} max={MAX_PRICE} prefix="₱" emptyLabel={b('needs.nomax')} label={b('needs.max')} />
        </div>
        <Button className="min-h-14 w-full text-base" onClick={() => { m.addNeed({ buyerId: user.id, buyer: user.buyer?.businessName ?? user.shortName, place: place || user.barangay, species: fish, kg, when, maxPrice: max || undefined }); close() }}>{b('needs.post')}</Button>
      </CenterModal>
    </div>
  )
}