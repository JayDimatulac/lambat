import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Snowflake, Undo2 } from 'lucide-react'
import ForkInTheNet from '../components/detail/ForkInTheNet'
import Lifeline from '../components/detail/Lifeline'
import AddIceSheet from '../components/detail/AddIceSheet'
import OutcomeSheet from '../components/detail/OutcomeSheet'
import SpeakButton from '../components/detail/SpeakButton'
import NeedAlert from '../components/detail/NeedAlert'
import { Story, WhyList } from '../components/detail/Story'
import Disclaimer from '../components/ui/Disclaimer'
import RiskBadge from '../components/ui/RiskBadge'
import { useCatches } from '../data/store'
import type { Outcome } from '../data/mock'
import { agoText, clockText, countdownText, rangeText, sellByText } from '../lib/time'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'

export default function CatchDetail() {
  const { id } = useParams()
  const t = useT()
  const { lang } = useSettings()
  const { catches, addIce, setOutcome } = useCatches()
  const [sheet, setSheet] = useState<'ice' | Outcome | null>(null)
  const [pulse, setPulse] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const c = catches.find((x) => x.id === id)
  const back = (
    <Link to="/catches" className="inline-flex min-h-12 items-center gap-1.5 font-semibold text-teal">
      <ArrowLeft size={20} strokeWidth={1.8} aria-hidden />
      {t('catches.title')}
    </Link>
  )
  if (!c) {
    return (
      <div className="space-y-3">
        {back}
        <p className="text-ink-soft">{t('detail.notfound')}</p>
      </div>
    )
  }

  const closed = !!c.outcome
  const timesUp = c.minsMin <= 0
  const upTo = c.minsMax - c.minsMin >= 30 ? t('detail.upto', { time: countdownText(c.minsMax) }) : null
  const speech = t('detail.speech', {
    species: c.species,
    kg: c.kg,
    left: timesUp ? t('detail.timesup') : t('time.left', { range: rangeText(c.hoursMin, c.hoursMax) }),
    sellby: sellByText(c.hoursMin, lang, t),
  })

  return (
    <div className="space-y-4">
      {back}
      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        {/* THE HERO: the countdown and the lifeline */}
        <section
          className="space-y-4 rounded-lg p-5 text-white shadow-raised lg:col-start-1"
          style={{ background: 'linear-gradient(180deg, var(--tide-sky-0), var(--tide-sea-1) 65%, var(--tide-sea-2))' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-[28px] font-semibold leading-tight text-white">{c.species}</h1>
              <p className="text-sm text-white">{c.kg} kg · {c.place} · {agoText(c.hoursAgo, t)}</p>
            </div>
            <RiskBadge level={c.risk} />
          </div>

          {!closed && (
            <>
              <div>
                <p className="text-sm font-semibold text-white">{t('detail.timeleft')}</p>
                <p key={pulse} className="anim-pop mt-1 font-display text-6xl font-bold leading-none tabular-nums" aria-live="polite">
                  {timesUp ? t('detail.timesup') : countdownText(c.minsMin)}
                </p>
                {upTo && !timesUp && <p className="mt-1 text-sm text-white">{upTo}</p>}
                <p className="mt-2 font-semibold">{sellByText(c.hoursMin, lang, t)}</p>
              </div>
              <Lifeline c={c} caughtLabel={t('when.caught')} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSheet('ice')} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cream px-4 text-sm font-semibold text-deep">
                  <Snowflake size={20} strokeWidth={1.8} aria-hidden />
                  {t('detail.addice')}
                </button>
                <SpeakButton text={speech} />
              </div>
            </>
          )}
        </section>

        {/* THE FORK, or the record of what happened */}
        <div className="space-y-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          {!closed && <NeedAlert c={c} />}
          {closed && c.outcome ? (
            <section className="space-y-3 rounded-lg border-2 border-teal bg-seafoam p-5 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-teal text-on-accent"><Check size={30} strokeWidth={2.4} aria-hidden /></span>
              <h2 className="text-2xl">{t(`tally.${c.outcome}`)}</h2>
              <p>{c.kg} kg · {c.closedAt ? t('closed.note', { when: clockText(c.closedAt, lang, t) }) : ''}</p>
              <button type="button" onClick={() => setOutcome(c.id, null)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-teal px-5 font-semibold text-teal">
                <Undo2 size={20} strokeWidth={1.8} aria-hidden />
                {t('closed.undo')}
              </button>
            </section>
          ) : (
            <ForkInTheNet c={c} onSell={() => setSheet('sold')} onShare={() => setSheet('shared')} onLost={() => setSheet('lost')} />
          )}
          <Disclaimer />
        </div>

        {!closed && <div className="lg:col-start-1"><WhyList c={c} /></div>}
        <div className="lg:col-start-1"><Story c={c} /></div>
      </div>

      <AddIceSheet
        c={c}
        open={sheet === 'ice'}
        onClose={() => setSheet(null)}
        onConfirm={(kg, extraMins) => {
          addIce(c.id, kg)
          setSheet(null)
          setPulse((p) => p + 1)
          setToast(t('toast.ice', { n: Math.max(1, Math.round(extraMins / 60)) }))
        }}
      />
      <OutcomeSheet
        c={c}
        kind={sheet === 'ice' ? null : sheet}
        onClose={() => setSheet(null)}
        onConfirm={(o) => {
          setOutcome(c.id, o)
          setSheet(null)
        }}
      />

      {toast && (
        <p role="status" className="anim-rise fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-full bg-deep px-4 py-3 text-center text-sm font-semibold text-white shadow-raised">
          {toast}
        </p>
      )}
    </div>
  )
}