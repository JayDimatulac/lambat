import type { ReactNode } from 'react'
import { CircleCheck, CircleAlert, TriangleAlert, CircleX } from 'lucide-react'
import type { Risk, Status } from './data'

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-line bg-card p-5 shadow-rest ${className}`}>{children}</div>
)
export const CardHead = ({ title, sub }: { title: string; sub: string }) => (
  <><h3 className="font-sans text-xl font-bold">{title}</h3><p className="mb-4 text-sm text-ink-soft">{sub}</p></>
)
// Risk is always icon + word + color
const RISK = {
  low: ['text-risk-low border-risk-low-line', 'Low', CircleCheck],
  mod: ['text-risk-moderate border-risk-moderate-line', 'Moderate', CircleAlert],
  high: ['text-risk-high border-risk-high-line', 'High', TriangleAlert],
  crit: ['text-risk-critical border-risk-critical-line', 'Critical', CircleX],
} as const
export function Badge({ risk }: { risk: Risk }) {
  const [cls, label, Icon] = RISK[risk]
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-0.5 text-[13px] font-semibold ${cls}`}><Icon size={15} />{label}</span>
}
const CHIP: Record<Status | 'info', string> = {
  pend: 'bg-risk-moderate-bg text-risk-moderate', ok: 'bg-risk-low-bg text-risk-low',
  no: 'bg-risk-critical-bg text-risk-critical', info: 'bg-seafoam text-teal',
}
export const Chip = ({ tone, children }: { tone: Status | 'info'; children: ReactNode }) => (
  <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-semibold ${CHIP[tone]}`}>{children}</span>
)
export const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="h-3 flex-1 overflow-hidden rounded-full bg-mint"><i className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
)
export function Seg<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map(([k, label]) => (
        <button key={k} aria-pressed={value === k} onClick={() => onChange(k)}
          className="rounded-full border border-line bg-mint px-4 py-1.5 text-sm font-semibold aria-pressed:border-teal aria-pressed:bg-teal aria-pressed:text-on-accent">{label}</button>
      ))}
    </div>
  )
}
export const Table = ({ head, children }: { head: string[]; children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] border-collapse text-sm">
      <thead><tr>{head.map((h, i) => <th key={i} className="border-b border-line px-3 py-2.5 text-left text-[13px] font-semibold text-ink-soft">{h}</th>)}</tr></thead>
      <tbody className="[&_td]:border-b [&_td]:border-line [&_td]:p-3 [&_tr:last-child_td]:border-0">{children}</tbody>
    </table>
  </div>
)