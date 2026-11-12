import { useEffect, useState } from 'react'
import { BookOpen, Check, ExternalLink, Loader2 } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { useT, type TFn } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

type Tab = 'req' | 'proc' | 'safe'
type Guide = {
  product: string
  equipment: string[]
  ingredients: string[]
  preparation: string[]
  steps: string[]
  safety: string[]
  source: { title: string; issuer: string; version: string | null; url: string | null }
}
type Ai = { about: string; terms: { term: string; meaning: string }[]; source: 'ai' | 'template' }
type Processing = {
  product: string
  suitability: { status: 'SUITABLE' | 'NOT_SUITABLE' | 'UNVERIFIED'; reason: string | null }
  message: string
  disclaimer: string
  guide: Guide | null
  ai: Ai | null
}
type FollowUp = { answer: string; supported: boolean; source: 'ai' | 'template'; disclaimer: string }

function errText(e: unknown, t: TFn): string {
  const status = e instanceof ApiError ? e.status : -1
  return status === 0 ? t('auth.err.network') : status === 429 ? t('auth.err.busy') : t('pg.err')
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h5 className="text-lg font-semibold">{title}</h5>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((x) => <li key={x}>{x}</li>)}
      </ul>
    </div>
  )
}

/* "View Process" for one pathway. The server decides if processing is suitable and sends the verified guide.
   The steps are shown exactly as stored; the AI only adds a short intro, explains words, and answers questions. */
export default function ProcessGuide({ catchId, product }: { catchId: string; product: string }) {
  const t = useT()
  const { lang } = useSettings()
  const l = lang === 'en' ? 'en' : 'fil'

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState<Processing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('req')
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [reply, setReply] = useState<FollowUp | null>(null)
  const [askError, setAskError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setBusy(true)
    setError(null)
    setReply(null)
    setTicked(new Set())
    api
      .get<Processing>(`/catches/${catchId}/processing?product=${encodeURIComponent(product)}&lang=${l}`)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(errText(e, t)) })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [open, catchId, product, l, t])

  const toggle = (i: number) =>
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const ask = async () => {
    const q = question.trim()
    if (q.length < 3 || asking) return
    setAsking(true)
    setAskError(null)
    try {
      setReply(await api.post<FollowUp>(`/catches/${catchId}/processing/ask`, { product, question: q, lang: l }))
    } catch (e) {
      setAskError(errText(e, t))
    } finally {
      setAsking(false)
    }
  }

  const guide = data?.guide ?? null
  const tabs: { id: Tab; label: string }[] = [
    { id: 'req', label: t('pg.tab.req') },
    { id: 'proc', label: t('pg.tab.proc') },
    { id: 'safe', label: t('pg.tab.safe') },
  ]

  return (
    <section className="space-y-4 rounded-lg border border-line bg-card p-5 shadow-rest">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-5 text-base font-semibold text-teal"
      >
        <BookOpen size={20} strokeWidth={1.8} aria-hidden />
        {open ? t('pg.hide') : t('pg.view')}
      </button>

      {open && busy && (
        <p className="inline-flex items-center gap-2 text-ink-soft">
          <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden />
          {t('pg.loading')}
        </p>
      )}
      {open && error && <p role="alert" className="text-sm font-semibold text-risk-critical">{error}</p>}

      {open && data && !busy && (
        <div className="space-y-4">
          {/* not suitable or no verified guide: no steps, only the server's plain sentence */}
          {!guide && (
            <div className="space-y-2 rounded-md border border-dashed border-line bg-mint p-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  data.suitability.status === 'NOT_SUITABLE' ? 'bg-risk-critical-bg text-risk-critical' : 'bg-seafoam text-teal'
                }`}
              >
                {data.suitability.status === 'NOT_SUITABLE' ? t('pg.notsuitable') : t('pg.unverified')}
              </span>
              {data.suitability.reason === 'no_verified_guide' && <h4 className="text-lg">{t('pg.verified')}</h4>}
              <p>{data.message}</p>
            </div>
          )}

          {guide && (
            <>
              {data.ai && (
                <div className="space-y-2">
                  <h4 className="text-lg">{t('pg.about')}</h4>
                  <p>{data.ai.about}</p>
                  {data.ai.terms.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-ink-soft">{t('pg.terms')}</p>
                      <ul className="space-y-1">
                        {data.ai.terms.map((x) => (
                          <li key={x.term}><span className="font-semibold">{x.term}:</span> {x.meaning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sm text-ink-soft">{data.ai.source === 'ai' ? t('explain.ai') : t('explain.plain')}</p>
                </div>
              )}

              <div role="tablist" className="inline-flex rounded-full border border-line bg-seafoam/50 p-1">
                {tabs.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === x.id}
                    onClick={() => setTab(x.id)}
                    className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                      tab === x.id ? 'bg-teal text-on-accent shadow-rest' : 'text-navy hover:bg-seafoam'
                    }`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>

              {tab === 'req' && (
                <div className="space-y-4">
                  <Block title={t('pg.equipment')} items={guide.equipment} />
                  <Block title={t('pg.ingredients')} items={guide.ingredients} />
                  {guide.preparation.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-lg font-semibold">{t('pg.prep')}</h5>
                      <ul className="space-y-2">
                        {guide.preparation.map((text, i) => {
                          const on = ticked.has(i)
                          return (
                            <li key={text}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={on}
                                onClick={() => toggle(i)}
                                className={`flex min-h-12 w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition ${on ? 'border-teal bg-seafoam' : 'border-line bg-card'}`}
                              >
                                <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-teal bg-teal text-on-accent' : 'border-line'}`}>
                                  {on && <Check size={16} strokeWidth={3} aria-hidden />}
                                </span>
                                <span className="flex-1">{text}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                  {guide.equipment.length + guide.ingredients.length + guide.preparation.length === 0 && (
                    <p className="text-ink-soft">{t('pg.incomplete')}</p>
                  )}
                </div>
              )}

              {tab === 'proc' && (
                <div className="space-y-2">
                  <h5 className="text-lg font-semibold">{t('pg.steps')}</h5>
                  {guide.steps.length > 0 ? (
                    <ol className="list-decimal space-y-2 pl-5">
                      {guide.steps.map((s) => <li key={s}>{s}</li>)}
                    </ol>
                  ) : (
                    <p className="text-ink-soft">{t('pg.incomplete')}</p>
                  )}
                </div>
              )}

              {tab === 'safe' && (
                <div className="space-y-2">
                  {guide.safety.length > 0 ? (
                    <Block title={t('pg.safety')} items={guide.safety} />
                  ) : (
                    <p className="text-ink-soft">{t('pg.incomplete')}</p>
                  )}
                </div>
              )}

              <p className="text-sm text-ink-soft">
                {t('pg.source')}: {guide.source.title}, {guide.source.issuer}
                {guide.source.version ? ` (${guide.source.version})` : ''}
                {guide.source.url && (
                  <a href={guide.source.url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-semibold text-teal underline">
                    {t('pg.opensrc')}
                    <ExternalLink size={14} strokeWidth={2} aria-hidden />
                  </a>
                )}
              </p>

              <form
                onSubmit={(e) => { e.preventDefault(); void ask() }}
                className="space-y-2 border-t border-line pt-4"
              >
                <label htmlFor={`ask-${catchId}-${product}`} className="text-lg font-semibold">{t('pg.ask.title')}</label>
                <div className="flex gap-2">
                  <input
                    id={`ask-${catchId}-${product}`}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={300}
                    placeholder={t('pg.ask.ph')}
                    className="min-h-12 flex-1 rounded-md border border-line bg-card px-3"
                  />
                  <button
                    type="submit"
                    disabled={asking || question.trim().length < 3}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-teal px-5 font-semibold text-on-accent disabled:opacity-60"
                  >
                    {asking && <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden />}
                    {asking ? t('pg.ask.busy') : t('pg.ask.btn')}
                  </button>
                </div>
                {askError && <p role="alert" className="text-sm font-semibold text-risk-critical">{askError}</p>}
                {reply && (
                  <div className="space-y-1 rounded-md bg-mint p-3">
                    {!reply.supported && <p className="text-sm font-semibold text-ink-soft">{t('pg.ask.nocover')}</p>}
                    <p>{reply.answer}</p>
                    <p className="text-sm text-ink-soft">{reply.source === 'ai' ? t('explain.ai') : t('explain.plain')}</p>
                  </div>
                )}
              </form>
            </>
          )}

          <p className="text-sm italic text-ink-soft">{data.disclaimer}</p>
        </div>
      )}
    </section>
  )
}