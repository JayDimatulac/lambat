import type { ComponentType, ReactNode } from 'react'
import type { Risk } from './data'

export type Icon = ComponentType<{ size?: number; className?: string }>

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-lg border border-line bg-card p-5 shadow-rest ${className}`}>{children}</section>
)

export const PageTitle = ({ title, sub }: { title: string; sub: string }) => (
  <div className="mb-5">
    <h1 className="font-numeral text-[30px] font-bold leading-tight">{title}</h1>
    <p className="mt-1 text-ink-soft">{sub}</p>
  </div>
)

export function Head({ icon: I, title, sub, right }: { icon?: Icon; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {I && <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><I size={22} /></span>}
        <div>
          <h2 className="font-numeral text-xl font-bold leading-tight">{title}</h2>
          {sub && <p className="text-sm text-ink-soft">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

// A buoy that sits lower in the water the worse the risk: low floats high, critical is nearly under.
const RISK: Record<Risk, { label: string; cls: string; y: number }> = {
  low: { label: 'Low', cls: 'border-risk-low-line bg-risk-low-bg text-risk-low', y: 6 },
  mod: { label: 'Moderate', cls: 'border-risk-moderate-line bg-risk-moderate-bg text-risk-moderate', y: 8.5 },
  high: { label: 'High', cls: 'border-risk-high-line bg-risk-high-bg text-risk-high', y: 11 },
  crit: { label: 'Critical', cls: 'border-risk-critical-line bg-risk-critical-bg text-risk-critical', y: 13.5 },
}
export function RiskBuoy({ risk, size = 18 }: { risk: Risk; size?: number }) {
  const y = RISK[risk].y
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <defs><clipPath id="admin-water"><rect x="0" y="0" width="20" height="14.2" /></clipPath></defs>
      <g clipPath="url(#admin-water)">
        <circle cx="10" cy={y} r="4.6" />
        <path d={`M5.6 ${y}H14.4`} />
      </g>
      <path d="M1.6 15.6Q3.6 14 5.6 15.6T9.6 15.6T13.6 15.6T17.6 15.6" />
    </svg>
  )
}
export function RiskTag({ risk }: { risk: Risk }) {
  const r = RISK[risk]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-0.5 text-[13px] font-semibold ${r.cls}`}>
      <RiskBuoy risk={risk} />{r.label}
    </span>
  )
}

type Tone = 'wait' | 'ok' | 'no' | 'warn' | 'info'
const TONE: Record<Tone, string> = {
  wait: 'bg-risk-moderate-bg text-risk-moderate', ok: 'bg-risk-low-bg text-risk-low', no: 'bg-risk-critical-bg text-risk-critical',
  warn: 'bg-risk-high-bg text-risk-high', info: 'bg-seafoam text-teal',
}
export const Chip = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold ${TONE[tone]}`}>
    <i className="size-1.5 rounded-full bg-current" />{children}
  </span>
)

export const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="h-3 flex-1 overflow-hidden rounded-full bg-mint">
    <i className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
  </div>
)

export function Pills<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-semibold transition hover:bg-seafoam aria-checked:border-teal aria-checked:bg-teal aria-checked:text-on-accent">
          {o.label}
          {o.count !== undefined && <span className="rounded-full bg-seafoam px-2 text-xs font-bold text-teal">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export const field = 'w-full rounded-[14px] border-[1.5px] border-line bg-mint px-3.5 py-2.5 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10'

export const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
    className="min-h-11 w-full rounded-full border border-line bg-card px-5 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10 sm:max-w-xs" />
)

export const Monogram = ({ text }: { text: string }) => (
  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-teal font-numeral text-base font-bold text-on-accent">{text}</span>
)

export function Empty({ icon: I, title, sub }: { icon: Icon; title: string; sub: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <I size={44} className="text-teal/60" />
      <p className="font-numeral text-xl font-bold">{title}</p>
      <p className="text-sm text-ink-soft">{sub}</p>
    </div>
  )
}