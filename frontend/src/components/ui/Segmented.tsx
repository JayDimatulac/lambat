import type { ReactNode } from 'react'

type Option<T extends string> = { value: T; label: ReactNode; aria?: string }

type Props<T extends string> = {
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  label: string
  className?: string
  tone?: 'teal' | 'coral'
}

// A pill-shaped toggle. One option is always selected.
export default function Segmented<T extends string>({ value, onChange, options, label, className = '', tone = 'teal' }: Props<T>) {
  const on = tone === 'coral' ? 'bg-coral text-deep shadow-raised' : 'bg-teal text-on-accent shadow-rest'
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-full border border-line bg-seafoam/50 p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.aria}
          onClick={() => onChange(o.value)}
          className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
            o.value === value ? on : 'text-navy hover:bg-seafoam'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}