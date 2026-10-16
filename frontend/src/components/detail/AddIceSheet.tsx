import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Sheet from '../ui/Sheet'
import Segmented from '../ui/Segmented'
import Button from '../ui/Button'
import { IceBlockIcon, IceSackIcon } from '../icons'
import type { Catch } from '../../data/mock'
import { ICE_KG, ICE_LEVELS, remaining, type IceUnit } from '../../lib/estimator'
import { countdownText } from '../../lib/time'
import { useT } from '../../lib/i18n'

const roundBtn = 'grid size-14 shrink-0 place-items-center rounded-full border-2 border-teal bg-card text-teal transition active:scale-90 disabled:opacity-30'

/* Add ice and see the new time before you confirm */
export default function AddIceSheet({ c, open, onClose, onConfirm }: { c: Catch; open: boolean; onClose: () => void; onConfirm: (kg: number, extraMins: number) => void }) {
  const t = useT()
  const [unit, setUnit] = useState<IceUnit>('sako')
  const [count, setCount] = useState(1)
  const model = c.model
  if (!model) return null

  const addKg = count * ICE_KG[unit]
  const last = model.events[model.events.length - 1].iceKg
  const now = Date.now()
  const after = remaining({ ...model, events: [...model.events, { at: now, iceKg: last + addKg }] }, now)
  const afterMins = Math.floor(after.leftMin * 60)
  const lit = ICE_LEVELS.indexOf(after.level)
  const Unit = unit === 'sako' ? IceSackIcon : IceBlockIcon

  return (
    <Sheet open={open} onClose={onClose} title={t('sheet.ice.title')}>
      <div className="flex justify-center">
        <Segmented<IceUnit>
          label={t('sheet.ice.title')}
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'sako', label: <><IceSackIcon size={20} />{t('ice.sako')}</> },
            { value: 'block', label: <><IceBlockIcon size={20} />{t('ice.block')}</> },
          ]}
        />
      </div>

      <div className="flex items-center justify-center gap-5">
        <button type="button" className={roundBtn} aria-label={t('ice.remove')} onClick={() => setCount(Math.max(1, count - 1))} disabled={count <= 1}>
          <Minus size={26} strokeWidth={2.2} aria-hidden />
        </button>
        <div className="flex min-w-32 flex-col items-center">
          <div className="flex gap-0.5 text-teal" aria-hidden="true">
            {Array.from({ length: Math.min(count, 5) }, (_, i) => <Unit key={i} size={30} />)}
          </div>
          <p className="font-display text-3xl font-bold tabular-nums" aria-live="polite">{count} <span className="text-base font-semibold">{unit === 'sako' ? t('ice.sako') : t('ice.block')}</span></p>
        </div>
        <button type="button" className={roundBtn} aria-label={t('ice.add')} onClick={() => setCount(Math.min(20, count + 1))}>
          <Plus size={26} strokeWidth={2.2} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-md border border-line bg-mint p-3">
          <p className="text-sm font-semibold text-ink-soft">{t('detail.before')}</p>
          <p className="font-display text-2xl font-bold tabular-nums">{c.minsMin > 0 ? countdownText(c.minsMin) : t('detail.timesup')}</p>
        </div>
        <div className="rounded-md border-2 border-teal bg-seafoam p-3">
          <p className="text-sm font-semibold text-ink-soft">{t('detail.after')}</p>
          <p className="font-display text-2xl font-bold tabular-nums" aria-live="polite">{countdownText(afterMins)}</p>
        </div>
      </div>

      <div className="flex justify-center gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <IceBlockIcon key={i} size={30} className={i < lit ? 'text-teal' : 'text-line'} />)}
      </div>
      <p className="text-center font-display text-lg font-semibold">{t(`ice.${after.level}`)}</p>

      <Button className="min-h-14 w-full text-base" onClick={() => { onConfirm(addKg, Math.max(0, afterMins - c.minsMin)); setCount(1) }}>
        {t('sheet.ice.confirm')}
      </Button>
    </Sheet>
  )
}