import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Sheet from '../ui/Sheet'
import Button from '../ui/Button'
import Disclaimer from '../ui/Disclaimer'
import type { Listing } from '../../lib/market'
import { useBT } from '../../lib/buyerText'

type Props = { l: Listing | null; mode: 'buy' | 'offer'; onClose: () => void; onConfirm: (price?: number) => void }

// Buying at the asking price, or offering a lower one. One sheet for both.
export default function OfferSheet({ l, mode, onClose, onConfirm }: Props) {
  const b = useBT()
  const [price, setPrice] = useState(0)
  if (!l) return null
  const p = mode === 'offer' ? (price || Math.max(1, l.ask - 10)) : l.ask
  const step = (d: number) => setPrice(Math.max(Math.ceil(l.ask * 0.5), Math.min(l.ask, p + d)))
  return (
    <Sheet open onClose={() => { setPrice(0); onClose() }} title={mode === 'buy' ? b('sheet.buy') : b('sheet.counter')}>
      <p className="text-lg font-semibold">{l.species} · {l.kg} kg · {l.fisher}</p>
      {mode === 'offer' ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">{b('sheet.yourprice')} (₱{l.ask}/kg {b('sheet.asked')})</p>
          <div className="flex items-center justify-between gap-3 rounded-md bg-mint p-3">
            <button type="button" aria-label="-5" onClick={() => step(-5)} className="grid size-14 place-items-center rounded-full border-2 border-teal text-teal"><Minus size={24} strokeWidth={2} aria-hidden /></button>
            <p className="font-numeral text-4xl font-extrabold text-teal">₱{p}<span className="text-lg text-ink-soft">/kg</span></p>
            <button type="button" aria-label="+5" onClick={() => step(5)} className="grid size-14 place-items-center rounded-full border-2 border-teal text-teal"><Plus size={24} strokeWidth={2} aria-hidden /></button>
          </div>
        </div>
      ) : (
        <p className="font-numeral text-4xl font-extrabold text-teal">₱{l.ask}<span className="text-lg text-ink-soft">/kg</span></p>
      )}
      <p className="text-xl font-bold">{b('offer.total', { n: (p * l.kg).toLocaleString('en-US') })}</p>
      {mode === 'offer' && <Disclaimer>{b('sheet.demo')}</Disclaimer>}
      <div className="space-y-3">
        <Button className="min-h-14 w-full text-base" onClick={() => { setPrice(0); onConfirm(mode === 'offer' ? p : undefined) }}>
          {mode === 'buy' ? b('sheet.confirmbuy') : b('sheet.send')}
        </Button>
        <Button variant="secondary" className="min-h-14 w-full" onClick={() => { setPrice(0); onClose() }}>{b('sheet.cancel')}</Button>
      </div>
    </Sheet>
  )
}