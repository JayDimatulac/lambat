import { useEffect, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'

export type LIcon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

export const inputCls = 'min-h-11 w-full rounded-lg border border-line bg-mint px-3.5 text-sm font-medium outline-none transition placeholder:text-ink-soft focus:border-teal focus:ring-2 focus:ring-teal/20'
export const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal px-5 text-sm font-bold text-on-accent shadow-rest transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50'
export const btnGhost = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-semibold transition hover:bg-seafoam/60 active:scale-[0.98] disabled:opacity-50'
export const btnDanger = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-risk-critical-line px-4 text-sm font-semibold text-risk-critical transition hover:bg-risk-critical-bg active:scale-[0.98] disabled:opacity-50'

export const initialsOf = (s: string) =>
  s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

// a select with a leading icon, used for the date and area filters
export function Pick({ icon: Icon, value, onChange, label, children }: { icon: LIcon; value: string; onChange: (v: string) => void; label: string; children: ReactNode }) {
  return (
    <label className="relative">
      <Icon size={18} strokeWidth={1.8} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="min-h-12 cursor-pointer appearance-none rounded-xl border border-line bg-card pl-11 pr-10 text-sm font-semibold shadow-rest outline-none transition focus:border-teal"
      >
        {children}
      </select>
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
    </label>
  )
}

// the standard card: an icon, a title, an optional action, then the content
export function Panel({ icon: Icon, title, sub, action, children, flush }: { icon?: LIcon; title?: string; sub?: string; action?: ReactNode; children: ReactNode; flush?: boolean }) {
  const head = !!(title || action)
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-card shadow-rest">
      {head && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-seafoam text-teal"><Icon size={20} strokeWidth={1.8} /></span>}
            {title && (
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold leading-tight tracking-tight">{title}</h2>
                {sub && <p className="truncate text-sm text-ink-soft">{sub}</p>}
              </div>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? (head ? 'mt-4' : '') : head ? 'p-5 pt-4' : 'p-5'}>{children}</div>
    </section>
  )
}

const TINT = {
  teal: 'bg-seafoam text-teal',
  coral: 'bg-coral/20 text-coral',
  green: 'bg-risk-low-bg text-risk-low',
  amber: 'bg-risk-moderate-bg text-risk-moderate',
} as const

export function Stat({ icon: Icon, label, value, unit, note, tone = 'teal' }: { icon: LIcon; label: string; value: ReactNode; unit?: string; note?: string; tone?: keyof typeof TINT }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl border border-line bg-card p-4 shadow-rest">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${TINT[tone]}`}><Icon size={20} strokeWidth={1.8} /></span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-soft">{label}</p>
        <p className="font-numeral text-2xl font-bold leading-tight tabular-nums">
          {value}
          {unit && <span className="ml-1 text-base font-semibold text-ink-soft">{unit}</span>}
        </p>
        {note && <p className="truncate text-xs text-ink-soft">{note}</p>}
      </div>
    </div>
  )
}

const BADGE = {
  teal: 'bg-seafoam text-teal',
  green: 'bg-risk-low-bg text-risk-low',
  amber: 'bg-risk-moderate-bg text-risk-moderate',
  red: 'bg-risk-critical-bg text-risk-critical',
  slate: 'bg-mint text-ink-soft ring-1 ring-line',
} as const

export function Badge({ tone = 'teal', children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[tone]}`}>{children}</span>
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, fontSize: size / 2.8 }} className="grid shrink-0 place-items-center rounded-full bg-seafoam font-bold text-teal">
      {initialsOf(name)}
    </span>
  )
}

export function Empty({ icon: Icon, text }: { icon: LIcon; text: string }) {
  return (
    <div className="grid place-items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-seafoam text-teal"><Icon size={26} strokeWidth={1.8} /></span>
      <p className="font-semibold text-ink-soft">{text}</p>
    </div>
  )
}

// segmented tabs
export function Seg<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { k: T; label: string; n?: number }[] }) {
  return (
    <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-mint p-1 [scrollbar-width:none]">
      {items.map((i) => {
        const on = i.k === value
        return (
          <button key={i.k} type="button" role="tab" aria-selected={on} onClick={() => onChange(i.k)}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${on ? 'bg-card text-teal shadow-rest' : 'text-ink-soft hover:text-navy'}`}>
            {i.label}
            {i.n !== undefined && <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${on ? 'bg-seafoam text-teal' : 'bg-line/60'}`}>{i.n}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Pager({ page, pages, onPage, info, prev, next }: { page: number; pages: number; onPage: (p: number) => void; info: string; prev: string; next: string }) {
  const b = 'grid size-10 place-items-center rounded-lg border border-line transition hover:bg-seafoam/60 disabled:opacity-40'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
      <p className="text-sm text-ink-soft">{info}</p>
      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label={prev} disabled={page <= 1} onClick={() => onPage(page - 1)} className={b}><ChevronLeft size={18} /></button>
          <span className="min-w-16 text-center text-sm font-semibold tabular-nums">{page} / {pages}</span>
          <button type="button" aria-label={next} disabled={page >= pages} onClick={() => onPage(page + 1)} className={b}><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-teal' : 'bg-line'}`}>
      <span className={`absolute top-1 size-6 rounded-full bg-card shadow-rest transition-all ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  )

}
const TILE = {
  blue: ['bg-seafoam/70', 'text-teal'],
  amber: ['bg-risk-moderate-bg', 'text-risk-moderate'],
  green: ['bg-risk-low-bg', 'text-risk-low'],
  red: ['bg-risk-critical-bg', 'text-risk-critical'],
} as const

// the tinted count card used on the dashboards
export function Tile({ icon: Icon, label, value, tone, to }: { icon: LIcon; label: string; value: ReactNode; tone: keyof typeof TILE; to?: string }) {
  const [bg, ink] = TILE[tone]
  const cls = `flex min-w-0 items-center gap-4 rounded-lg border border-line p-4 shadow-rest ${bg}`
  const body = (
    <>
      <span className={`grid size-14 shrink-0 place-items-center rounded-full bg-card/70 ${ink}`}><Icon size={28} strokeWidth={1.8} /></span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{label}</span>
        <b className="block font-numeral text-4xl font-bold leading-tight tabular-nums">{value}</b>
      </span>
    </>
  )
  return to ? <Link to={to} className={`${cls} transition hover:-translate-y-0.5 hover:shadow-raised`}>{body}</Link> : <div className={cls}>{body}</div>
}

// a dialog in the middle of the screen: Esc or a tap outside closes it
// a dialog in the middle of the screen: Esc or a tap outside closes it
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = prev }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-deep/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div role="dialog" aria-modal="true" aria-label={title} className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border border-line bg-card p-5 shadow-raised sm:p-6`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="truncate font-display text-xl font-bold tracking-tight">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-seafoam/60"><X size={18} /></button>
          </div>
          <div className="grid gap-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}