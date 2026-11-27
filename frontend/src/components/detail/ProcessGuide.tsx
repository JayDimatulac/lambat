import { useEffect, useState } from 'react'
import { Check, ExternalLink, Loader2, X } from 'lucide-react'
import type { Catch } from '../../data/mock'
import { api, ApiError } from '../../lib/api'
import { iceFromLanding, type Pathway } from '../../lib/pathways'
import { useT, type TFn } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

type Tab = 'check' | 'req' | 'proc' | 'safe'

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
    <ul className="space-y-1 text-sm">
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
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${checked ? 'border-teal bg-seafoam' : 'border-line bg-mint'}`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-teal bg-teal text-on-accent' : 'border-line'}`}>
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

/* The process guide for one product. It loads by itself as soon as a product is chosen (nothing to click),
   and its body scrolls inside the card, so the page stays short. */
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
  const done = pathway.conditions.filter((text, i) => condOn(i, text)).length
  const guide = data?.guide ?? null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'check', label: t('va.tab.check') },
    { id: 'req', label: t('pg.tab.req') },
    { id: 'proc', label: t('pg.tab.proc') },
    { id: 'safe', label: t('pg.tab.safe') },
  ]

  // what to show for the tabs that need the server's guide
  const waiting = busy ? (
    <p className="inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 size={16} className="animate-spin" aria-hidden />{t('pg.loading')}</p>
  ) : error ? (
    <p role="alert" className="text-sm font-semibold text-risk-critical">{error}</p>
  ) : !guide ? (
    <div className="space-y-2 rounded-lg border border-dashed border-line bg-mint p-4 text-sm">
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${data?.suitability.status === 'NOT_SUITABLE' ? 'bg-risk-critical-bg text-risk-critical' : 'bg-seafoam text-teal'}`}>
        {data?.suitability.status === 'NOT_SUITABLE' ? t('pg.notsuitable') : t('pg.unverified')}
      </span>
      {data?.suitability.reason === 'no_verified_guide' && <p className="font-semibold">{t('pg.verified')}</p>}
      <p>{data?.message}</p>
    </div>
  ) : null

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card shadow-rest">
      <header className="space-y-3 border-b border-line p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-teal">{t('va.proc.title')}</p>
            <h3 className="font-display text-2xl font-semibold leading-tight">{pathway.name}</h3>
          </div>
          <span className="rounded-full bg-seafoam px-3 py-1 text-xs font-bold text-teal">{t('va.ai.badge')}</span>
        </div>

        {/* the AI's short explanation of the product */}
        {data?.ai ? (
          <div className="space-y-1.5 text-sm">
            <p>{data.ai.about}</p>
            {data.ai.terms.length > 0 && (
              <details>
                <summary className="cursor-pointer font-semibold text-teal">{t('pg.terms')}</summary>
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

        <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-mint p-1 [scrollbar-width:none]">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-10 flex-1 shrink-0 rounded-lg px-3 text-sm font-semibold transition ${tab === id ? 'bg-card text-teal shadow-rest' : 'text-ink-soft hover:text-navy'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* this part scrolls inside the card */}
      <div className="max-h-[min(55vh,380px)] min-h-[200px] space-y-4 overflow-y-auto p-4">
        {tab === 'check' && (
          <>
            <p className="rounded-lg bg-mint p-3 text-sm italic">{pathway.wording}</p>
            <Group title={`${t('va.check')} · ${t('va.checked', { n: done, total: pathway.conditions.length })}`}>
              <Ticks items={pathway.conditions} on={condOn} onToggle={(i) => toggle(`c${i}`)} locked={isIceItem} />
            </Group>
            <Group title={t('va.avoid')}>
              <ul className="space-y-1.5 text-sm">
                {pathway.avoid.map((text) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-risk-critical-bg text-risk-critical" aria-hidden="true"><X size={12} strokeWidth={3} /></span>
                    {text}
                  </li>
                ))}
              </ul>
            </Group>
          </>
        )}

        {tab !== 'check' && (waiting ?? (
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
                  <ol className="space-y-2 text-sm">
                    {guide.steps.map((step, i) => (
                      <li key={step} className="flex gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-seafoam text-xs font-bold text-teal">{i + 1}</span>
                        <span className="pt-0.5">{step}</span>
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
      </div>

      <footer className="space-y-1 border-t border-line px-4 py-2.5 text-xs text-ink-soft">
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