import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Waves, X } from 'lucide-react'
import TideScene from '../components/tide/TideScene'
import Disclaimer from '../components/ui/Disclaimer'
import RiskBadge from '../components/ui/RiskBadge'
import Button from '../components/ui/Button'
import { IceStep, KilosStep, SpeciesStep, WhenStep, iceKgOf, type Draft } from '../components/log/steps'
import { useCatches } from '../data/store'
import { user } from '../data/mock'
import { hoursAtAmbient, iceLevel, type IceLevel } from '../lib/estimator'
import { SPECIES, TILES } from '../lib/species'
import { agoText, rangeText, sellByText } from '../lib/time'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'

const STEPS = 4
const LAST_KEY = 'lambat.lastTile'
const readLast = () => {
  try { return localStorage.getItem(LAST_KEY) } catch { return null }
}

const emptyDraft: Draft = { tileId: null, speciesId: null, variant: null, kg: 10, hoursAgo: 1, iceUnit: 'sako', iceCount: 0, iceOverride: null }

/* A rope with a knot for each question. Answered knots fill in. */
function Knots({ step }: { step: number }) {
  return (
    <div className="relative flex flex-1 items-center justify-between px-1" aria-hidden="true">
      <span className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded bg-line" />
      {Array.from({ length: STEPS }, (_, i) => (
        <span key={i} className={`relative size-4 rounded-full border-2 transition-all ${i <= step ? 'scale-110 border-teal bg-teal' : 'border-line bg-card'}`} />
      ))}
    </div>
  )
}

/* The reveal: the buoy settles to its depth, then the estimate appears */
function Reveal({ draft, level, savedId, onAgain }: { draft: Draft; level: IceLevel; savedId: string; onAgain: () => void }) {
  const t = useT()
  const { lang } = useSettings()
  const { catches } = useCatches()
  const saved = catches.find((c) => c.id === savedId)
  const [shown, setShown] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  // wait for the buoy to settle (skipped when the phone asks for reduced motion)
  useEffect(() => {
    if (shown) return
    const id = window.setTimeout(() => setShown(true), 1900)
    return () => window.clearTimeout(id)
  }, [shown])
  if (!saved) return null

  const sp = SPECIES[draft.variant ?? draft.speciesId ?? 'other']
  const urgent = saved.risk === 'high' || saved.risk === 'critical'
  const range = rangeText(saved.hoursMin, saved.hoursMax)

  return (
    <div className="space-y-5">
      <TideScene catches={[saved]} />
      {!shown ? (
        <p className="flex items-center justify-center gap-2 text-ink-soft" role="status">
          <Waves size={22} strokeWidth={1.8} className="text-teal" aria-hidden />
          {t('reveal.measuring')}
        </p>
      ) : (
        <div className="anim-rise space-y-5">
          <div className="space-y-2 rounded-md border-2 border-line bg-card p-4 shadow-rest">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl">{t('reveal.title')}</h2>
              <RiskBadge level={saved.risk} />
            </div>
            <p className="font-display text-3xl font-bold">{t('time.left', { range })}</p>
            <p className="font-semibold">{sellByText(saved.hoursMin, lang, t)}</p>
          </div>

          <div className="space-y-2 rounded-md border border-line bg-card p-4">
            <h3 className="text-lg">{t('reveal.why')}</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{draft.hoursAgo === 0 ? t('why.time.now') : t('why.time', { when: agoText(draft.hoursAgo, t) })}</li>
              <li>{t('why.ice', { level: t(`ice.${level}`).toLowerCase() })}</li>
                            <li>{t(hoursAtAmbient(sp.l0Min) <= 10 ? 'why.species.fast' : 'why.species.mid', { species: saved.species })}</li>
              {sp.histamine && <li>{t('why.histamine')}</li>}
            </ul>
          </div>

          <Disclaimer />

          <div className="space-y-3">
            <Link
              to={urgent ? `/buyers?catch=${saved.id}` : '/catches'}
              className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-coral px-5 font-semibold text-deep shadow-raised"
            >
              {urgent ? t('home.findbuyer') : t('reveal.mine')}
              <ArrowRight size={20} strokeWidth={1.8} aria-hidden />
            </Link>
            <Button variant="secondary" onClick={onAgain} className="min-h-14 w-full">{t('reveal.another')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LogCatch() {
  const t = useT()
  const { addCatch } = useCatches()
  const [step, setStep] = useState(0) // 0..3 are questions, 4 is the reveal
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saved, setSaved] = useState<{ id: string; level: IceLevel } | null>(null)
  const [lastTileId] = useState(readLast)

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const reveal = step === STEPS

    const save = () => {
    const sp = SPECIES[draft.variant ?? draft.speciesId ?? 'other']
    const tile = TILES.find((x) => x.id === draft.tileId)
    const caughtAt = Date.now() - draft.hoursAgo * 3_600_000
    const iceKg = iceKgOf(draft)
    const id = addCatch({
      species: tile ? tile.name : t('species.other'),
      speciesId: draft.tileId === 'other' ? undefined : (draft.variant ?? draft.speciesId ?? undefined),
      shape: tile?.shape ?? 'scad',
      kg: draft.kg,
      place: user.place,
      caughtAt,
      model: { l0Min: sp.l0Min, l0Max: sp.l0Max, histamine: !!sp.histamine, kg: draft.kg, events: [{ at: caughtAt, iceKg }] },
    })
    try { if (draft.tileId && draft.tileId !== 'other') localStorage.setItem(LAST_KEY, draft.tileId) } catch { /* storage can be blocked */ }
    setSaved({ id, level: iceLevel(iceKg, draft.kg) })
    setStep(STEPS)
  }

  const again = () => {
    setDraft(emptyDraft)
    setSaved(null)
    setStep(0)
  }

  const questions = ['log.q.species', 'log.q.kilos', 'log.q.when', 'log.q.ice'] as const

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-32 pt-4">
      <header className="flex items-center gap-3">
        <Link to="/" aria-label={t('menu.close')} className="grid size-12 shrink-0 place-items-center rounded-full hover:bg-seafoam">
          <X size={24} strokeWidth={1.8} aria-hidden />
        </Link>
        <Knots step={step} />
        <span className="w-20 shrink-0 text-right text-sm text-ink-soft">{reveal ? '' : t('log.step', { n: step + 1, total: STEPS })}</span>
      </header>

      <div key={step} className="anim-rise mt-6 flex-1 space-y-6">
        {!reveal && <h1 className="text-center text-[28px] leading-tight">{t(questions[step])}</h1>}
        {step === 0 && <SpeciesStep draft={draft} set={set} lastTileId={lastTileId} />}
        {step === 1 && <KilosStep draft={draft} set={set} />}
        {step === 2 && <WhenStep draft={draft} set={set} />}
        {step === 3 && <IceStep draft={draft} set={set} />}
        {reveal && saved && <Reveal draft={draft} level={saved.level} savedId={saved.id} onAgain={again} />}
      </div>

      {!reveal && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-md gap-3">
            {step > 0 && (
              <Button variant="secondary" className="min-h-14" onClick={() => setStep(step - 1)}>
                {t('log.back')}
              </Button>
            )}
            <Button
              className="min-h-14 flex-1 text-base"
              disabled={step === 0 && !draft.speciesId}
              onClick={() => (step === STEPS - 1 ? save() : setStep(step + 1))}
            >
              {step === STEPS - 1 ? t('log.save') : t('log.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}