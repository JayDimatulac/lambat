import { useState } from 'react'
import { LostFishIcon, SharedFishIcon, SoldFishIcon } from '../../components/home/HomeIcons'
import { CoinWaveIcon, DryRackIcon, ScaleIcon } from './AdminIcons'
import { OUTCOMES, SEASON } from './data'
import { Card, Chip, Head, type Icon } from './ui'

const ICONS: Icon[] = [SoldFishIcon, SharedFishIcon, DryRackIcon, LostFishIcon]
// One fish, cut into the four places the catch went. The tail is what got away.
const FISH = 'M8 75C60 10 200 0 300 60L392 12V138L300 90C200 150 60 140 8 75Z'
const X0 = 8
const X1 = 392

export default function CatchFish() {
  const [sel, setSel] = useState<number | null>(null)
  const total = OUTCOMES.reduce((a, o) => a + o.tons, 0)
  let acc = 0
  const segs = OUTCOMES.map((o) => {
    const x = X0 + (acc / total) * (X1 - X0)
    acc += o.tons
    return { ...o, x, w: (o.tons / total) * (X1 - X0) }
  })
  const pick = sel === null ? null : OUTCOMES[sel]

  return (
    <Card>
      <Head icon={ScaleIcon} title="The whole catch" sub="Tap a part of the fish to see where it went" />
      <div className="grid items-center gap-5 lg:grid-cols-[auto_1fr]">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-soft"><ScaleIcon size={20} className="text-teal" />Landed in total</p>
          <b className="mt-1 block font-numeral text-6xl font-bold leading-none">{total.toFixed(1)}<span className="ml-1 text-3xl">t</span></b>
          <p className="mt-2 text-sm text-ink-soft">{SEASON.catches} catches logged</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="ok">{SEASON.thisWeek}</Chip>
            <Chip tone="info"><CoinWaveIcon size={16} />{SEASON.value} recovered</Chip>
          </div>
        </div>

        <svg viewBox="0 0 400 150" className="block w-full" role="img" aria-label="The catch as a fish, divided into sold, redistributed, processed and lost">
          <defs>
            <clipPath id="catch-fish"><path d={FISH} /></clipPath>
            <pattern id="catch-scales" width="22" height="22" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.2">
                <circle cx="11" cy="11" r="11" /><circle cx="0" cy="0" r="11" /><circle cx="22" cy="0" r="11" /><circle cx="0" cy="22" r="11" /><circle cx="22" cy="22" r="11" />
              </g>
            </pattern>
          </defs>
          <g clipPath="url(#catch-fish)">
            {segs.map((s, i) => (
              <rect key={s.name} x={s.x} y="0" width={s.w} height="150" fill={s.color} className="cursor-pointer"
                style={{ opacity: sel === null || sel === i ? 1 : 0.28, transition: 'opacity 0.25s' }} onClick={() => setSel(sel === i ? null : i)} />
            ))}
            <rect width="400" height="150" fill="url(#catch-scales)" pointerEvents="none" />
            {segs.slice(1).map((s) => <path key={s.name} d={`M${s.x} 0V150`} stroke="var(--color-card)" strokeWidth="3" pointerEvents="none" />)}
          </g>
          <path d={FISH} fill="none" stroke="var(--color-navy)" strokeOpacity="0.85" strokeWidth="3" strokeLinejoin="round" pointerEvents="none" />
          <path d="M84 38Q100 75 84 112" fill="none" stroke="var(--color-card)" strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" pointerEvents="none" />
          <circle cx="46" cy="64" r="6.5" fill="var(--color-card)" stroke="var(--color-navy)" strokeWidth="2.5" pointerEvents="none" />
          <circle cx="46" cy="64" r="2.5" fill="var(--color-navy)" pointerEvents="none" />
        </svg>
      </div>

      <p className="mt-3 min-h-6 text-sm" aria-live="polite">
        {pick ? <><b>{pick.name}:</b> {pick.tons} t, {Math.round((pick.tons / total) * 100)}% of everything landed. {pick.note}</> : <span className="text-ink-soft">Each color is one place the catch went.</span>}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OUTCOMES.map((o, i) => {
          const I = ICONS[i]
          return (
            <button key={o.name} type="button" aria-pressed={sel === i} onClick={() => setSel(sel === i ? null : i)}
              className="rounded-md border border-line bg-mint p-3 text-left transition hover:bg-seafoam aria-pressed:border-teal aria-pressed:bg-seafoam">
              <i className="mb-2 block h-1.5 w-10 rounded-full" style={{ background: o.color }} />
              <span className="flex items-center gap-1.5 text-[13px] font-semibold"><I size={20} />{o.name}</span>
              <b className="mt-1 block font-numeral text-2xl leading-tight">{o.tons} t</b>
              <small className="text-xs text-ink-soft">{Math.round((o.tons / total) * 100)}% of the catch</small>
            </button>
          )
        })}
      </div>
    </Card>
  )
}