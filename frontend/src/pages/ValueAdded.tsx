import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, ArrowRight, Brain, ChevronDown, ClipboardCheck, Layers, Lock, Scale, Snowflake, Star } from 'lucide-react'
import PathwayCard from '../components/detail/PathwayCard'
import ProcessGuide from '../components/detail/ProcessGuide'
import { FishIcon } from '../components/icons'
import Sidebar from '../components/valueadded/Sidebar'
import { BenefitStrip, ValueHero } from '../components/valueadded/ValueHero'
import RiskBadge from '../components/ui/RiskBadge'
import { byUrgency, isActive } from '../data/mock'
import { useCatches } from '../data/store'
import { iceFromLanding, pathwaysFor, type Pathway } from '../lib/pathways'
import { productImage } from '../lib/productImages'
import { agoText } from '../lib/time'
import { useT, type Key } from '../lib/i18n'
import { useSettings } from '../lib/settings'
// Why a catch has no pathway: one plain sentence for each reason
const WHY: Record<string, Key> = {
  'lock.value': 'va.locked.risk',
  'lock.value.ice': 'va.locked.ice',
  'lock.value.none': 'va.locked.none',
}

const selectCls = 'min-h-12 w-full appearance-none rounded-md border border-line bg-mint pl-10 pr-9 text-base font-semibold'
function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1 text-sm font-semibold">
      {label}
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal">{icon}</span>
        {children}
      </span>
    </label>
  )
}

const riskTag = (p: Pathway) => (p.allowed.length === 1 ? 'va.tag.low' : 'va.tag.lowmod') as Key
function ProductCard({ p, first, open, onOpen }: { p: Pathway; first: boolean; open: boolean; onOpen: () => void }) {
  const t = useT()
  const photo = productImage(p.name)
  return (
    <article className={`flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-rest ${open ? 'border-coral' : 'border-line'}`}>
      <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-seafoam">
        {photo && <img src={photo} alt={p.name} loading="lazy" className="size-full object-cover" />}
        {first && (
          <span className="absolute right-0 top-3 inline-flex items-center gap-1 rounded-l-full bg-teal px-3 py-1 text-xs font-bold text-on-accent">
            <Star size={12} strokeWidth={2.4} aria-hidden="true" />
            {t('va.prod.rec')}
          </span>
        )}
        {photo && <span className="absolute bottom-2 right-2 rounded-full bg-deep/65 px-2.5 py-0.5 text-xs font-semibold text-white">{t('va.samplephoto')}</span>}
      </div>
      <h4 className="font-sans text-lg font-bold leading-tight">{p.name}</h4>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-seafoam px-3 py-1 text-xs font-semibold text-teal">{p.detail}</span>
        <span className="rounded-full bg-seafoam px-3 py-1 text-xs font-semibold text-teal">{t(riskTag(p))}</span>
      </div>
      <ul className="space-y-1.5 text-sm">
        <li className="flex items-start gap-2"><ClipboardCheck size={16} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0 text-teal" />{t('va.row.checks', { n: p.conditions.length })}</li>
        <li className="flex items-start gap-2"><Snowflake size={16} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0 text-teal" />{p.needsIce ? t('va.row.ice.yes') : t('va.row.ice.no')}</li>

      </ul>
      <button
        type="button"
        aria-expanded={open}
        onClick={onOpen}
        className="mt-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-coral px-4 font-bold text-deep shadow-rest transition hover:brightness-105 active:scale-[0.98]"
      >
        {open ? t('pg.hide') : t('pg.view')}
        <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </article>
  )
}

export default function ValueAdded() {
  const t = useT()
  const { lang } = useSettings()
  const { catches } = useCatches()
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<string | null>(null)
  const aiRef = useRef<HTMLElement>(null)
  const processRef = useRef<HTMLDivElement>(null)

  const active = catches.filter(isActive).sort(byUrgency)
  const chosen = active.find((c) => c.id === params.get('catch')) ?? active.find((c) => pathwaysFor(c).available.length > 0) ?? active[0]
  const result = chosen ? pathwaysFor(chosen) : null
  const opened = result?.available.find((p) => p.id === openId) ?? null

  const pick = (id: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('catch', id)
      return next
    })
    setOpenId(null)
  }
  const species = [...new Set(active.map((c) => c.species))]
  const sameSpecies = chosen ? active.filter((c) => c.species === chosen.species) : []

  const openedId = opened?.id
  const chosenId = chosen?.id
  useEffect(() => {
    if (openedId) processRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openedId, chosenId])

  if (!chosen || !result) {
    return (
      <div className="mx-auto w-full max-w-[1440px] space-y-5">
        <ValueHero c={null} />
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('va.empty')}</p>
      </div>
    )
  }

  const top = result.available[0]

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <ValueHero c={chosen} />
      <BenefitStrip />
       <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-5">
          {/* 1. Select the catch. Species, quantity and condition all come from the catch you logged. */}
          <section className="space-y-4 rounded-lg border border-line bg-card p-4 shadow-rest sm:p-5">
            <h3 className="flex items-center gap-2 font-sans text-lg font-bold">
              <span className="grid size-7 place-items-center rounded-full bg-teal text-sm text-on-accent" aria-hidden="true">1</span>
              {t('va.sel.title')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
              <Field label={t('va.sel.species')} icon={<FishIcon size={20} />}>
                <select
                  value={chosen.species}
                  onChange={(e) => { const next = active.find((c) => c.species === e.target.value); if (next) pick(next.id) }}
                  className={selectCls}
                >
                  {species.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </Field>
              <Field label={t('va.sel.qty')} icon={<Scale size={20} />}>
                <select value={chosen.id} onChange={(e) => pick(e.target.value)} className={selectCls}>
                  {sameSpecies.map((c) => <option key={c.id} value={c.id}>{c.kg} kg · {agoText(c.hoursAgo, t)}</option>)}
                </select>
                <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </Field>
              <div className="block min-w-0 space-y-1 text-sm font-semibold">
                {t('va.sel.cond')}
                <div className="relative flex min-h-12 items-center rounded-md border border-line bg-mint pl-10 pr-3">
                  <Activity size={20} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal" />
                  <RiskBadge level={chosen.risk} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => aiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-teal px-5 font-bold text-on-accent shadow-rest transition hover:brightness-110 sm:col-span-2 xl:col-span-1"
              >
                {t('va.sel.go')}
                <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </section>
           {top ? (
            <>
              {lang === 'fil' && <p className="text-sm text-ink-soft">{t('va.englishnote')}</p>}
               {/* 2. The recommended pathway, with the real reasons from the rules */}
              <section ref={aiRef} className="scroll-mt-24 space-y-4 rounded-lg border border-line bg-card p-4 shadow-rest sm:p-5">
                <div className="flex items-start gap-3">
                  <Brain size={36} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-teal" />
                  <div className="min-w-0">
                    <h3 className="flex flex-wrap items-center gap-2 font-sans text-xl font-bold">
                      {t('va.ai.title')}
                      <span className="rounded-full bg-seafoam px-3 py-1 text-xs font-bold text-teal">{t('va.ai.badge')}</span>
                    </h3>
                    <p className="text-sm text-ink-soft">{t('va.ai.sub')}</p>
                  </div>
                </div>
                <div className="grid gap-4 rounded-lg border border-line bg-mint p-3 md:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:divide-x md:divide-line">
                  <div className="aspect-[3/2] overflow-hidden rounded-md bg-seafoam">
                    {productImage(top.name) && <img src={productImage(top.name)} alt={top.name} loading="lazy" className="size-full object-cover" />}
                  </div>
                  <div className="space-y-2 md:px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-risk-moderate-bg px-3 py-1 text-xs font-bold text-risk-moderate">
                      <Star size={12} strokeWidth={2.4} aria-hidden="true" />
                      {t('va.ai.top')}
                    </span>
                    <p className="font-display text-3xl font-semibold leading-tight">{top.name}</p>
                    <p className="text-sm text-ink-soft">{top.detail}</p>
                  </div>
                  <div className="space-y-2 md:px-4">
                    <p className="font-bold">{t('va.ai.why')}</p>
                    <ul className="space-y-1.5 text-sm">
                      {[t('va.ai.w1', { species: chosen.species }), t('va.ai.w2'), top.needsIce && iceFromLanding(chosen) ? t('va.ai.w3.yes') : !top.needsIce ? t('va.ai.w3.no') : ''].filter(Boolean).map((line) => (
                        <li key={line} className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-risk-low-bg text-risk-low" aria-hidden="true">✓</span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
               {/* 3. Every pathway that passes the rules, one card each */}
              <section className="space-y-4 rounded-lg border border-line bg-card p-4 shadow-rest sm:p-5">
                <div className="flex items-start gap-3">
                  <Layers size={32} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-teal" />
                  <div>
                    <h3 className="font-sans text-xl font-bold">{t('va.prod.title')}</h3>
                    <p className="text-sm text-ink-soft">{t('va.prod.sub')}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {result.available.map((p, i) => (
                    <ProductCard key={`${chosen.id}-${p.id}`} p={p} first={i === 0} open={p.id === openId} onOpen={() => setOpenId(p.id === openId ? null : p.id)} />
                  ))}
                </div>
              </section>
               {/* 4. One process guide at a time: the checklist, and the server's verified guide */}
              {opened && (
                <div ref={processRef} className="scroll-mt-24 space-y-3">
                  <h3 className="font-sans text-xl font-bold">{t('va.proc.title')}: {opened.name}</h3>
                  <div className="grid items-start gap-5 xl:grid-cols-2">
                    <PathwayCard p={opened} c={chosen} />
                    <ProcessGuide key={`${chosen.id}-${opened.id}`} catchId={chosen.id} product={opened.name} defaultOpen />
                  </div>
                </div>
              )}
            </>
          ) : (
            <section ref={aiRef} className="scroll-mt-24 space-y-3 rounded-lg border border-dashed border-line bg-mint p-5">
              <span className="grid size-12 place-items-center rounded-full bg-seafoam text-teal"><Lock size={22} strokeWidth={1.8} aria-hidden /></span>
              <h3 className="text-xl">{result.reason ? t(result.reason) : ''}</h3>
              <p>{result.reason && WHY[result.reason] ? t(WHY[result.reason]) : ''}</p>
              <Link to={`/catches/${chosen.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-5 font-semibold text-deep">
                {t('va.see')}
                <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
              </Link>
            </section>
          )}
        </div>
         <Sidebar c={chosen} />
      </div>
    </div>
  )
}