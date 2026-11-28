import { useEffect, useState } from 'react'
import { ArrowRight, Check, ExternalLink, Loader2, Lock, X } from 'lucide-react'
import type { Catch } from '../../data/mock'
import { api, ApiError } from '../../lib/api'
import { iceFromLanding, type Pathway } from '../../lib/pathways'
import { useT, type TFn } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

type Tab = 'check' | 'req' | 'proc' | 'safe'
const ORDER: Tab[] = ['check', 'req', 'proc', 'safe']

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

function errText(e: unknown, t: TFn): string {
  const status = e instanceof ApiError ? e.status : -1
  return status === 0 ? t('auth.err.network') : status === 429 ? t('auth.err.busy') : t('pg.err')
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{title}</h4>
      {children}
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-teal" />{item}</li>
      ))}
    </ul>
  )
}

function Ticks({ items, on, onToggle, locked }: { items: string[]; on: (i: number, text: string) => boolean; onToggle: (i: number) => void; locked?: (text: string) => boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((text, i) => {
        const checked = on(i, text)
        return (
          <li key={text}>
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              disabled={!!locked?.(text)}
              onClick={() => onToggle(i)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${checked ? 'border-teal bg-seafoam' : 'border-line bg-mint hover:border-teal'}`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${checked ? 'border-teal bg-teal text-on-accent' : 'border-line'}`}>
                {checked && <Check size={14} strokeWidth={3} aria-hidden />}
              </span>
              <span className="flex-1">{text}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// A ring that fills as the checks are ticked, and turns green when all of them are done
function Ring({ done, total, label }: { done: number; total: number; label: string }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <div role="img" aria-label={label} className="relative size-14 shrink-0 sm:size-16">
      <svg viewBox="0 0 56 56" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-line" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          className={`transition-[stroke-dashoffset] duration-500 ${pct === 1 ? 'stroke-risk-low-line' : 'stroke-teal'}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-numeral text-sm font-bold">{done}/{total}</span>
    </div>
  )
}

/* The process guide for one product. It loads by itself as soon as a product is chosen (nothing to click).
   The page scrolls, not this card. The Process steps unlock once every check is ticked. */
export default function ProcessGuide({ c, pathway }: { c: Catch; pathway: Pathway }) {
  const t = useT()
  const { lang } = useSettings()
  const requestLang = lang === 'en' ? 'en' : 'fil'

  const [busy, setBusy] = useState(true)
  const [data, setData] = useState<Processing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('check')
  const [ticked, setTicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    setData(null)
    setError(null)
    setTicked(new Set())
    api
      .get<Processing>(`/catches/${c.id}/processing?product=${encodeURIComponent(pathway.name)}&lang=${requestLang}`)
      .then((r) => { if (!cancelled) setData(r) })
      .catch((e: unknown) => { if (!cancelled) setError(errText(e, t)) })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [c.id, pathway.name, requestLang, t])

  const toggle = (key: string) =>
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const onIce = iceFromLanding(c)
  const isIceItem = (text: string) => text.startsWith('Kept on ice from landing')
  const condOn = (i: number, text: string) => (isIceItem(text) ? onIce : ticked.has(`c${i}`))
  const total = pathway.conditions.length
  const done = pathway.conditions.filter((text, i) => condOn(i, text)).length
  const ready = total > 0 && done === total
  const guide = data?.guide ?? null
  const aiAnswered = data?.ai?.source === 'ai'

  const labels: Record<Tab, string> = {
    check: t('va.tab.check'),
    req: t('pg.tab.req'),
    proc: t('pg.tab.proc'),
    safe: t('pg.tab.safe'),
  }
  const nextTab = ORDER[ORDER.indexOf(tab) + 1]
  const procLocked = tab === 'proc' && !ready

  // what to show for the tabs that need the server's guide
  const waiting = busy ? (
    <p className="inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 size={16} className="animate-spin" aria-hidden />{t('pg.loading')}</p>
  ) : error ? (
    <p role="alert" className="text-sm font-semibold text-risk-critical">{error}</p>
  ) : !guide ? (
    <div className="space-y-2 rounded-xl border border-dashed border-line bg-mint p-4 text-sm">
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${data?.suitability.status === 'NOT_SUITABLE' ? 'bg-risk-critical-bg text-risk-critical' : 'bg-seafoam text-teal'}`}>
        {data?.suitability.status === 'NOT_SUITABLE' ? t('pg.notsuitable') : t('pg.unverified')}
      </span>
      {data?.suitability.reason === 'no_verified_guide' && <p className="font-semibold">{t('pg.verified')}</p>}
      <p>{data?.message}</p>
    </div>
  ) : null

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card shadow-rest">
      <header className="space-y-4 border-b border-line p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide text-teal">{t('va.proc.title')}</p>
            <h3 className="break-words font-display text-2xl font-semibold leading-tight sm:text-3xl">{pathway.name}</h3>
            {(aiAnswered || ready) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aiAnswered && <span className="rounded-full bg-seafoam px-3 py-1 text-xs font-bold text-teal">{t('va.ai.badge')}</span>}
                {ready && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-risk-low-bg px-3 py-1 text-xs font-bold text-risk-low">
                    <Check size={12} strokeWidth={3} aria-hidden />{t('va.ready')}
                  </span>
                )}
              </div>
            )}
          </div>
          <Ring done={done} total={total} label={t('va.checked', { n: done, total })} />
        </div>

        {/* the AI's short explanation of the product */}
        {data?.ai ? (
          <div className="space-y-1.5 text-sm">
            <p>{data.ai.about}</p>
            {data.ai.terms.length > 0 && (
              <details>
                <summary className="min-h-10 cursor-pointer py-2 font-semibold text-teal">{t('pg.terms')}</summary>
                <ul className="mt-1.5 space-y-1">
                  {data.ai.terms.map(({ term, meaning }) => (
                    <li key={term}><span className="font-semibold">{term}:</span> {meaning}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ) : busy ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3 w-11/12 animate-pulse rounded bg-line" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-line" />
          </div>
        ) : null}

        {/* the four steps: number above the word on a phone, side by side from tablet up */}
        <div role="tablist" className="grid grid-cols-4 gap-1 rounded-2xl border border-line bg-mint p-1">
          {ORDER.map((id, i) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center text-[11px] font-semibold leading-tight transition sm:flex-row sm:gap-2 sm:text-sm ${tab === id ? 'bg-card text-teal shadow-rest' : 'text-ink-soft hover:text-navy'}`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${tab === id ? 'bg-teal text-on-accent' : 'bg-seafoam text-teal'}`}>
                {id === 'proc' && !ready ? <Lock size={12} strokeWidth={2.4} aria-hidden /> : i + 1}
              </span>
              <span className="min-w-0 break-words">{labels[id]}</span>
            </button>
          ))}
        </div>
      </header>

      <div key={tab} className="anim-rise min-h-[200px] space-y-5 p-4 sm:p-5">
        {tab === 'check' && (
          <>
            <p className="rounded-xl bg-mint p-3.5 text-sm italic">{pathway.wording}</p>
            <Group title={`${t('va.check')} · ${t('va.checked', { n: done, total })}`}>
              <Ticks items={pathway.conditions} on={condOn} onToggle={(i) => toggle(`c${i}`)} locked={isIceItem} />
            </Group>
            <div className="space-y-2.5 rounded-xl border border-risk-critical-line/40 bg-risk-critical-bg p-3.5">
              <h4 className="text-sm font-bold uppercase tracking-wide text-risk-critical">{t('va.avoid')}</h4>
              <ul className="space-y-2 text-sm">
                {pathway.avoid.map((text) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-card text-risk-critical" aria-hidden="true"><X size={12} strokeWidth={3} /></span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {procLocked && (
          <div className="space-y-3 rounded-xl border border-dashed border-line bg-mint p-4 text-center sm:p-5">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-seafoam text-teal"><Lock size={20} strokeWidth={1.8} aria-hidden /></span>
            <p className="text-sm font-semibold">{t('va.lock.proc')}</p>
            <p className="text-xs text-ink-soft">{t('va.checked', { n: done, total })}</p>
            <button type="button" onClick={() => setTab('check')} className="inline-flex min-h-12 items-center justify-center rounded-full bg-teal px-5 font-semibold text-on-accent">
              {t('va.gocheck')}
            </button>
          </div>
        )}

        {tab !== 'check' && !procLocked && (waiting ?? (
          <>
            {tab === 'req' && guide && (
              <>
                {guide.equipment.length > 0 && <Group title={t('pg.equipment')}><Bullets items={guide.equipment} /></Group>}
                {guide.ingredients.length > 0 && <Group title={t('pg.ingredients')}><Bullets items={guide.ingredients} /></Group>}
                {guide.preparation.length > 0 && (
                  <Group title={t('pg.prep')}>
                    <Ticks items={guide.preparation} on={(i) => ticked.has(`p${i}`)} onToggle={(i) => toggle(`p${i}`)} />
                  </Group>
                )}
                {guide.equipment.length + guide.ingredients.length + guide.preparation.length === 0 && <p className="text-sm text-ink-soft">{t('pg.incomplete')}</p>}
              </>
            )}
            {tab === 'proc' && guide && (
              <Group title={t('pg.steps')}>
                {guide.steps.length > 0 ? (
                  <ol className="space-y-3 text-sm">
                    {guide.steps.map((step, i) => (
                      <li key={step} className="flex gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-seafoam text-xs font-bold text-teal">{i + 1}</span>
                        <span className="pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-ink-soft">{t('pg.incomplete')}</p>
                )}
              </Group>
            )}
            {tab === 'safe' && guide && (
              <Group title={t('pg.safety')}>
                {guide.safety.length > 0 ? <Bullets items={guide.safety} /> : <p className="text-sm text-ink-soft">{t('pg.incomplete')}</p>}
              </Group>
            )}
          </>
        ))}

        {nextTab && (
          <button
            type="button"
            onClick={() => setTab(nextTab)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-teal px-5 font-semibold text-on-accent sm:w-auto"
          >
            {t('va.next')}: {labels[nextTab]} <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>

      <footer className="space-y-1 border-t border-line px-4 py-3 text-xs text-ink-soft sm:px-5">
        {guide && (
          <p>
            {t('pg.source')}: {guide.source.title}, {guide.source.issuer}
            {guide.source.version ? ` (${guide.source.version})` : ''}
            {guide.source.url && (
              <a href={guide.source.url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-semibold text-teal underline">
                {t('pg.opensrc')}<ExternalLink size={12} strokeWidth={2} aria-hidden />
              </a>
            )}
          </p>
        )}
        {data?.disclaimer && <p className="italic">{data.disclaimer}</p>}
        {data?.ai && <p>{data.ai.source === 'ai' ? t('explain.ai') : t('explain.plain')}</p>}
        {lang === 'fil' && <p>{t('va.englishnote')}</p>}
      </footer>
    </section>
  )
}