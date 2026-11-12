import { useEffect, useState, type ReactNode } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import SpeakButton from './SpeakButton'
import RiskBadge from '../ui/RiskBadge'
import { api, ApiError } from '../../lib/api'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import type { RiskLevel } from '../../lib/risk'

type Answer = {
  sections: { why: string[]; factors: string[]; know: string[]; next: string[] }
  reminder: string
  text: string // the whole explanation in one piece, for the read-aloud button
  source: 'ai' | 'template'
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-bold">{title}</h3>
      {children}
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-base leading-snug">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  )
}

// Asks the server to explain the estimate in plain words. The server only uses numbers it calculated itself,
// and falls back to a fixed text if the AI is busy, so this never comes back empty.
export default function ExplainCard({ id, species, kg, risk }: { id: string; species: string; kg: number; risk: RiskLevel }) {
  const t = useT()
  const { lang } = useSettings()
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState<string | null>(null)

  // the explanation is written in one language, so ask again if the person switches language
  useEffect(() => {
    setAnswer(null)
    setError(null)
  }, [lang])

  const ask = async () => {
    setBusy(true)
    setError(null)
    try {
      setAnswer(await api.post<Answer>(`/catches/${id}/explain`, { lang: lang === 'en' ? 'en' : 'fil' }))
    } catch (e) {
      const status = e instanceof ApiError ? e.status : -1
      setError(
        status === 0 ? t('auth.err.network') : status === 429 ? t('auth.err.busy') : status === 409 ? t('explain.unavailable') : t('explain.err'),
      )
    } finally {
      setBusy(false)
    }
  }

  const s = answer?.sections

  return (
    <section className="space-y-4 rounded-lg border border-line bg-card p-5 shadow-rest">
      {!answer && (
        <button
          type="button"
          onClick={ask}
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-5 text-base font-semibold text-teal disabled:opacity-60"
        >
          {busy ? <Loader2 size={20} strokeWidth={2} className="animate-spin" aria-hidden /> : <Sparkles size={20} strokeWidth={1.8} aria-hidden />}
          {busy ? t('explain.loading') : t('explain.btn')}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-risk-critical">
          {error}
        </p>
      )}
      {answer && s && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal">
                <Sparkles size={20} strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold leading-tight">{t('explain.btn')}</h2>
                <p className="text-sm text-ink-soft">
                  {t('explain.sub')} · {species}, {kg} kg
                </p>
              </div>
            </div>
            <RiskBadge level={risk} />
          </div>

          {/* the first line is the headline, the rest are short details */}
          <Block title={t('explain.h.why')}>
            <div className="space-y-1">
              {s.why.map((x, i) => (
                <p key={i} className={`text-base leading-snug ${i === 0 ? 'font-semibold' : ''}`}>
                  {x}
                </p>
              ))}
            </div>
          </Block>
          {/* a part the AI had nothing to say about is left out, not shown empty */}
          {s.factors.length > 0 && (
            <Block title={t('explain.h.factors')}>
              <Bullets items={s.factors} />
            </Block>
          )}
          {s.know.length > 0 && (
            <Block title={t('explain.h.know')}>
              <Bullets items={s.know} />
            </Block>
          )}
          {s.next.length > 0 && (
            <Block title={t('explain.h.next')}>
              <Bullets items={s.next} />
            </Block>
          )}

          <div className="space-y-1 border-t border-line pt-3">
            <p className="text-sm font-semibold">{answer.reminder}</p>
            <p className="text-sm text-ink-soft">{answer.source === 'ai' ? t('explain.ai') : t('explain.plain')}</p>
          </div>
          <SpeakButton text={answer.text} tone="light" />
        </>
      )}
    </section>
  )
}