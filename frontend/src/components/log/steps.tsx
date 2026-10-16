import { Check, Minus, Plus } from 'lucide-react'
import FishShape from '../FishShape'
import Chip from '../ui/Chip'
import Segmented from '../ui/Segmented'
import Dial from './Dial'
import DayBar from './DayBar'
import { IceBlockIcon, IceSackIcon } from '../icons'
import { ICE_KG, ICE_LEVELS, iceLevel, type IceUnit } from '../../lib/estimator'
import { SPECIES, TILES, defaultMember } from '../../lib/species'
import { catchTimeText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

export type Draft = {
  tileId: string | null
  speciesId: string | null
  variant: string | null // which scad, when the person knows (null = not sure)
  kg: number
  hoursAgo: number
  iceUnit: IceUnit
  iceCount: number
  iceOverride: number | null // kg of ice, when the person knows it
}
type StepProps = { draft: Draft; set: (patch: Partial<Draft>) => void }

export const iceKgOf = (d: Draft) => (d.iceOverride !== null ? d.iceOverride : d.iceCount * ICE_KG[d.iceUnit])

const roundBtn =
  'grid size-16 shrink-0 place-items-center rounded-full border-2 border-teal bg-card text-teal transition active:scale-90 disabled:opacity-30'

/* 1. SPECIES: one tap on a picture. Last-used fish comes first. */
export function SpeciesStep({ draft, set, lastTileId }: StepProps & { lastTileId: string | null }) {
  const t = useT()
  const tiles = [...TILES].sort((a, b) => Number(b.id === lastTileId) - Number(a.id === lastTileId))
  const tile = TILES.find((x) => x.id === draft.tileId)

  const cell = (on: boolean) =>
    `relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-md border-2 p-2 text-center transition active:scale-95 ${on ? 'border-teal bg-seafoam' : 'border-line bg-card'}`

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label={t('log.q.species')} className="grid grid-cols-3 gap-3">
        {tiles.map((x) => {
          const on = draft.tileId === x.id
          return (
            <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => set({ tileId: x.id, speciesId: defaultMember(x), variant: null })} className={cell(on)}>
              {x.id === lastTileId && <span className="absolute left-1 top-1 rounded-full bg-coral px-1.5 text-xs font-bold text-deep">{t('species.last')}</span>}
              {on && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-teal text-on-accent"><Check size={14} strokeWidth={3} aria-hidden /></span>}
              <FishShape shape={x.shape} className="mt-2 h-9 w-full text-teal" />
              <span className="text-[15px] font-semibold leading-tight">{x.name}</span>
              <span className="simple-hide text-xs text-ink-soft">{x.aliases.length ? x.aliases.join(' · ') : x.english}</span>
            </button>
          )
        })}
        <button type="button" role="radio" aria-checked={draft.tileId === 'other'} onClick={() => set({ tileId: 'other', speciesId: 'other', variant: null })} className={cell(draft.tileId === 'other')}>
          {draft.tileId === 'other' && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-teal text-on-accent"><Check size={14} strokeWidth={3} aria-hidden /></span>}
          <span className="grid size-9 place-items-center text-2xl font-bold text-teal" aria-hidden="true">?</span>
          <span className="text-[15px] font-semibold leading-tight">{t('species.other')}</span>
          <span className="simple-hide text-xs text-ink-soft">{t('species.other.en')}</span>
        </button>
      </div>

      {/* the three scads are all called Galunggong, so this follow-up is optional */}
      {tile && tile.members.length > 1 && (
        <div className="anim-rise space-y-2 rounded-md border border-line bg-card p-3">
          <p className="text-sm font-semibold">{t('species.which')}</p>
          <div className="flex flex-wrap gap-2">
            {tile.members.map((m) => (
              <Chip key={m} active={draft.variant === m} onClick={() => set({ variant: m })}>{SPECIES[m].chip}</Chip>
            ))}
            <Chip active={draft.variant === null} onClick={() => set({ variant: null })}>{t('species.notsure')}</Chip>
          </div>
        </div>
      )}
    </div>
  )
}

/* 2. KILOS: a weighing dial, a big stepper and quick picks */
export function KilosStep({ draft, set }: StepProps) {
  const t = useT()
  const bump = (n: number) => set({ kg: Math.min(500, Math.max(1, draft.kg + n)) })
  return (
    <div className="space-y-5">
      <Dial kg={draft.kg} />
      <div className="flex items-center justify-center gap-5">
        <button type="button" className={roundBtn} aria-label={t('kilos.less')} onClick={() => bump(-1)} disabled={draft.kg <= 1}>
          <Minus size={30} strokeWidth={2.2} aria-hidden />
        </button>
        <p className="min-w-32 text-center font-display text-5xl font-bold tabular-nums" aria-live="polite">
          {draft.kg}
          <span className="ml-1 text-xl font-semibold">kg</span>
        </p>
        <button type="button" className={roundBtn} aria-label={t('kilos.more')} onClick={() => bump(1)}>
          <Plus size={30} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {[5, 10, 25, 50, 100].map((n) => (
          <Chip key={n} active={draft.kg === n} onClick={() => set({ kg: n })}>{n} kg</Chip>
        ))}
      </div>
    </div>
  )
}

/* 3. WHEN: slide along the day. Quick picks for the common answers. */
export function WhenStep({ draft, set }: StepProps) {
  const t = useT()
  const { lang } = useSettings()
  const quick: { h: number; label: string }[] = [
    { h: 0, label: t('when.now') },
    { h: 3, label: t('ago.h', { n: 3 }) },
    { h: 6, label: t('ago.h', { n: 6 }) },
    { h: 12, label: t('ago.h', { n: 12 }) },
    { h: 24, label: t('when.yesterday') },
    { h: 48, label: t('ago.d', { n: 2 }) },
  ]
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <p className="font-display text-3xl font-bold">{draft.hoursAgo === 0 ? t('when.now') : t('ago.h', { n: draft.hoursAgo })}</p>
        <p className="text-ink-soft" aria-live="polite">{t('when.caughtat', { time: catchTimeText(draft.hoursAgo, lang, t) })}</p>
      </div>
      <DayBar hoursAgo={draft.hoursAgo} caughtLabel={t('when.caught')} nowLabel={t('when.nowlabel')} />
      <div>
        <input
          type="range"
          min={0}
          max={48}
          step={1}
          value={draft.hoursAgo}
          onChange={(e) => set({ hoursAgo: Number(e.target.value) })}
          aria-label={t('when.slider')}
          className="h-12 w-full accent-teal"
        />
        <div className="flex justify-between text-sm text-ink-soft">
          <span>{t('when.nowlabel')}</span>
          <span>{t('ago.d', { n: 2 })}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {quick.map((q) => (
          <Chip key={q.h} active={draft.hoursAgo === q.h} onClick={() => set({ hoursAgo: q.h })}>{q.label}</Chip>
        ))}
      </div>
    </div>
  )
}

/* 4. ICE: add sacks or blocks. No thermometer: a row of ice cubes shows how cold it will stay. */
export function IceStep({ draft, set }: StepProps) {
  const t = useT()
  const level = iceLevel(iceKgOf(draft), draft.kg)
  const lit = ICE_LEVELS.indexOf(level)
  const Unit = draft.iceUnit === 'sako' ? IceSackIcon : IceBlockIcon
  const override = draft.iceOverride !== null
  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <Segmented<IceUnit>
          label={t('log.q.ice')}
          value={draft.iceUnit}
          onChange={(v) => set({ iceUnit: v })}
          options={[
            { value: 'sako', label: <><IceSackIcon size={20} />{t('ice.sako')}</> },
            { value: 'block', label: <><IceBlockIcon size={20} />{t('ice.block')}</> },
          ]}
        />
      </div>

      <div className="flex min-h-20 flex-wrap items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-line bg-ice p-3">
        {draft.iceCount === 0 && <span className="text-ink-soft">{t('ice.none')}</span>}
        {Array.from({ length: Math.min(draft.iceCount, 10) }, (_, i) => (
          <Unit key={i} size={40} className="anim-rise text-teal" />
        ))}
        {draft.iceCount > 10 && <span className="font-bold text-teal">+{draft.iceCount - 10}</span>}
      </div>

      <div className="flex items-center justify-center gap-5">
        <button type="button" className={roundBtn} aria-label={t('ice.remove')} onClick={() => set({ iceCount: Math.max(0, draft.iceCount - 1), iceOverride: null })} disabled={draft.iceCount === 0}>
          <Minus size={30} strokeWidth={2.2} aria-hidden />
        </button>
        <p className="min-w-32 text-center font-display text-4xl font-bold tabular-nums" aria-live="polite">
          {draft.iceCount} <span className="text-lg font-semibold">{draft.iceUnit === 'sako' ? t('ice.sako') : t('ice.block')}</span>
        </p>
        <button type="button" className={roundBtn} aria-label={t('ice.add')} onClick={() => set({ iceCount: Math.min(30, draft.iceCount + 1), iceOverride: null })}>
          <Plus size={30} strokeWidth={2.2} aria-hidden />
        </button>
      </div>

      <div className="space-y-2 rounded-md border border-line bg-card p-4 text-center">
        <p className="text-sm font-semibold text-ink-soft">{t('ice.cold')}</p>
        <div className="flex justify-center gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <IceBlockIcon key={i} size={34} className={`transition ${i < lit ? 'text-teal' : 'text-line'}`} />
          ))}
        </div>
        <p className="font-display text-xl font-semibold" aria-live="polite">{t(`ice.${level}`)}</p>
      </div>

      <div className="space-y-2">
        <Chip active={override} onClick={() => set({ iceOverride: override ? null : Math.max(5, iceKgOf(draft)) })} className="w-full">
          {t('ice.override')}
        </Chip>
        {override && (
          <div className="anim-rise flex items-center justify-center gap-4">
            <button type="button" className={roundBtn} aria-label={t('ice.remove')} onClick={() => set({ iceOverride: Math.max(0, (draft.iceOverride ?? 0) - 5) })}>
              <Minus size={26} strokeWidth={2.2} aria-hidden />
            </button>
            <p className="min-w-32 text-center font-display text-3xl font-bold tabular-nums">{draft.iceOverride} <span className="text-base font-semibold">{t('ice.override.kg')}</span></p>
            <button type="button" className={roundBtn} aria-label={t('ice.add')} onClick={() => set({ iceOverride: (draft.iceOverride ?? 0) + 5 })}>
              <Plus size={26} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}