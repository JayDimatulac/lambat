import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, ArrowRight, ChevronDown, ChevronRight, Lock, Scale, Star } from 'lucide-react'
import ProcessGuide from '../components/detail/ProcessGuide'
import { FishIcon } from '../components/icons'
import { ValueHero } from '../components/valueadded/ValueHero'
import RiskBadge from '../components/ui/RiskBadge'
import { byUrgency, isActive } from '../data/mock'
import { useCatches } from '../data/store'
import { pathwaysFor, type Pathway } from '../lib/pathways'
import { productImage } from '../lib/productImages'
import { agoText } from '../lib/time'
import { useT, type Key } from '../lib/i18n'

// Why a catch has no pathway: one plain sentence for each reason
const WHY: Record<string, Key> = {
  'lock.value': 'va.locked.risk',
  'lock.value.ice': 'va.locked.ice',
  'lock.value.none': 'va.locked.none',
}

const selectCls = 'min-h-12 w-full appearance-none rounded-lg border border-line bg-mint pl-10 pr-9 text-base font-semibold'
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

// One product: a small picture (shown here once), its name, and why it is on the list. Tap to see its process.
function ProductRow({ p, first, selected, onSelect }: { p: Pathway; first: boolean; selected: boolean; onSelect: () => void }) {
  const t = useT()
  const photo = productImage(p.name)
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full min-w-[250px] shrink-0 snap-start items-center gap-3 rounded-xl border bg-card p-2.5 text-left shadow-rest transition lg:min-w-0 ${selected ? 'border-coral ring-2 ring-coral/30' : 'border-line hover:border-teal'}`}
    >
      <span className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-seafoam">
        {photo && <img src={photo} alt="" loading="lazy" className="size-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[15px] leading-tight">{p.name}</b>
        <span className="block truncate text-xs text-ink-soft">{p.detail}</span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {first && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2 py-0.5 text-[11px] font-bold text-on-accent">
              <Star size={11} strokeWidth={2.4} aria-hidden="true" />{t('va.prod.rec')}
            </span>
          )}
          <span className="rounded-full bg-seafoam px-2 py-0.5 text-[11px] font-semibold text-teal">{t(riskTag(p))}</span>
        </span>
      </span>
      <ChevronRight size={18} aria-hidden="true" className="hidden shrink-0 text-ink-soft lg:block" />
    </button>
  )
}

export default function ValueAdded() {
  const t = useT()
  const { catches } = useCatches()
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<string | null>(null)

  const active = catches.filter(isActive).sort(byUrgency)
  const chosen = active.find((c) => c.id === params.get('catch')) ?? active.find((c) => pathwaysFor(c).available.length > 0) ?? active[0]
  const result = chosen ? pathwaysFor(chosen) : null

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

  if (!chosen || !result) {
    return (
      <div className="mx-auto w-full max-w-[1440px] space-y-4">
        <ValueHero c={null} />
        <p className="rounded-lg border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('va.empty')}</p>
      </div>
    )
  }

  // the first product is the recommendation and is shown right away; tapping another one switches the guide
  const selected = result.available.find((p) => p.id === openId) ?? result.available[0]

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4">
      <ValueHero c={chosen} />

      {/* Select the catch. Species, quantity and condition all come from the catch you logged. */}
      <section className="rounded-xl border border-line bg-card p-4 shadow-rest">
        <h2 className="mb-3 font-sans text-base font-bold">{t('va.sel.title')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
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
            <div className="relative flex min-h-12 items-center rounded-lg border border-line bg-mint pl-10 pr-3">
              <Activity size={20} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal" />
              <RiskBadge level={chosen.risk} />
            </div>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          {/* the recommended products: a row you swipe on a phone, a list on a computer */}
          <section aria-label={t('va.prod.title')} className="min-w-0 space-y-2">
            <h2 className="px-1 font-sans text-base font-bold">{t('va.prod.title')}</h2>
            <div className="flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0">
              {result.available.map((p, i) => (
                <ProductRow key={`${chosen.id}-${p.id}`} p={p} first={i === 0} selected={p.id === selected.id} onSelect={() => setOpenId(p.id)} />
              ))}
            </div>
            <p className="px-1 text-xs text-ink-soft">{t('va.samplephoto')}</p>
          </section>

          {/* its process, written by the AI as soon as a product is chosen */}
          <ProcessGuide key={`${chosen.id}-${selected.id}`} c={chosen} pathway={selected} />
        </div>
      ) : (
        <section className="space-y-3 rounded-xl border border-dashed border-line bg-mint p-5">
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
  )
}