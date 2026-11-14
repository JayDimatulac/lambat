import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, Lightbulb, Loader2 } from 'lucide-react'
import RiskBadge from '../ui/RiskBadge'
import { api, ApiError } from '../../lib/api'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import type { RiskLevel } from '../../lib/risk'
import { strandForAction, type ActionCode, type StrandId } from '../../lib/actions'

type Rec = {
  action: ActionCode
  title: string
  why: string
  reasons: string[]
  limitation: string
  supported: boolean // false = the server asks for a review, so there is no action button
  source: 'ai' | 'template'
  reminder: string
  allowedNextActions: ActionCode[]
}

type Props = {
  id: string
  species: string
  kg: number
  risk: RiskLevel
  stamp: string // changes when the assessment changes, so the suggestion is asked for again
  onAction: (best: StrandId | null | undefined) => void // tells the Fork which strand to glow
  onAddIce: () => void
  onShare: () => void
}

const BUTTON = 'inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-5 text-base font-semibold text-deep'

// "LAMBAT suggests": the server's rules choose the action; this card only shows it and the reasons.
export default function NextActionCard({ id, species, kg, risk, stamp, onAction, onAddIce, onShare }: Props) {
  const t = useT()
  const { lang } = useSettings()
  const l = lang === 'en' ? 'en' : 'fil'
  const [rec, setRec] = useState<Rec | null>(null)
  const [busy, setBusy] = useState(false)
  const [errKind, setErrKind] = useState<'net' | 'busy' | 'other' | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    setErrKind(null)
    api
      .post<Rec>(`/catches/${id}/next-action`, { lang: l })
      .then((r) => {
        if (cancelled) return
        setRec(r)
        setHidden(false)
        onAction(strandForAction(r.action, r.supported))
      })
      .catch((e) => {
        if (cancelled) return
        const status = e instanceof ApiError ? e.status : -1
        if (status === 409) {
          // the catch has an outcome or an order: nothing to suggest
          setHidden(true)
          onAction(undefined)
        } else {
          setErrKind(status === 0 ? 'net' : status === 429 ? 'busy' : 'other')
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, l, stamp, onAction])

  if (hidden) return null

  const canAct = !!rec && rec.supported && rec.allowedNextActions.includes(rec.action)
  const cta = !rec || !canAct ? null : rec.action === 'FIND_BUYER' ? (
    <Link to={`/buyers?catch=${id}`} className={BUTTON}>{t('strand.buyer')}</Link>
  ) : rec.action === 'EXPLORE_PROCESSING' ? (
    <Link to={`/value-added?catch=${id}`} className={BUTTON}>{t('strand.value')}</Link>
  ) : rec.action === 'SHARE_CATCH' ? (
    <button type="button" onClick={onShare} className={BUTTON}>{t('strand.share')}</button>
  ) : rec.action === 'ADD_ICE' ? (
    <button type="button" onClick={onAddIce} className={BUTTON}>{t('detail.addice')}</button>
  ) : null

  return (
    <section className="space-y-3 rounded-lg border border-line bg-card p-5 shadow-rest" aria-live="polite">
      {busy && !rec && (
        <p className="inline-flex items-center gap-2 text-ink-soft">
          <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden />
          {t('nba.loading')}
        </p>
      )}
      {errKind && !rec && (
        <p role="alert" className="text-sm font-semibold text-risk-critical">
          {errKind === 'net' ? t('auth.err.network') : errKind === 'busy' ? t('auth.err.busy') : t('explain.err')}
        </p>
      )}

      {rec && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal">
                <Lightbulb size={20} strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold leading-tight">{t('nba.title')}</h2>
                <p className="text-sm text-ink-soft">
                  {t('explain.sub')} · {species}, {kg} kg
                </p>
              </div>
            </div>
            <RiskBadge level={risk} />
          </div>

          <h3 className="text-xl font-bold leading-snug">{rec.title}</h3>
          <p className="text-base leading-snug">{rec.why}</p>
          {rec.reasons.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-base leading-snug">
              {rec.reasons.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <Info size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden />
            <span>{rec.limitation}</span>
          </p>

          {cta}

          <div className="space-y-1 border-t border-line pt-3">
            <p className="text-sm font-semibold">{rec.reminder}</p>
            <p className="text-sm text-ink-soft">{rec.source === 'ai' ? t('explain.ai') : t('explain.plain')}</p>
          </div>
        </>
      )}
    </section>
  )
}