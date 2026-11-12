import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import { useT } from '../../lib/i18n'

const MAX_HOURS = 48 // same as the slider's max in WhenStep

type Props = {
  hoursAgo: number
  presetHours: number[] // values of the quick chips
  onPick: (hours: number) => void
}

export default function CustomHours({ hoursAgo, presetHours, onPick }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const isCustom = !presetHours.includes(hoursAgo)
  const n = Number(text)
  const valid = text.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= MAX_HOURS

  const toggle = () => {
    if (!open) setText(String(hoursAgo))
    setOpen(!open)
  }
  const save = () => {
    if (!valid) return
    onPick(Math.round(n))
    setOpen(false)
  }

  return (
    <>
    <Chip active={isCustom} onClick={toggle}>
        <span className="inline-flex items-center gap-1.5">
          <Plus size={18} strokeWidth={1.7} aria-hidden />
          {t('log.custom')}
        </span>
    </Chip>

      {open && (
        <div className="anim-rise col-span-full w-full basis-full space-y-3 rounded-md border border-line bg-card p-4">
          <label htmlFor="custom-hours" className="block font-semibold">{t('log.custom.q')}</label>
          <div className="flex items-center gap-3">
            <input
              id="custom-hours"
              autoFocus
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_HOURS}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') setOpen(false)
              }}
              className="h-12 w-24 rounded-sm border-2 border-line bg-mint px-3 text-center text-xl font-bold focus:border-teal focus:outline-none"
            />
            <span className="text-ink-soft">{t('log.custom.unit')}</span>
          </div>
          {text !== '' && !valid && (
            <p role="alert" className="text-sm font-semibold text-risk-high">{t('log.custom.error')}</p>
          )}
          <Button className="min-h-12 w-full" disabled={!valid} onClick={save}>{t('log.custom.save')}</Button>
        </div>
      )}
    </>
  )
}