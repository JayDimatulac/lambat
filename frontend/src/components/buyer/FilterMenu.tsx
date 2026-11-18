import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type FilterOption<T extends string | number> = { value: T; label: string }

export default function FilterMenu<T extends string | number>({
  title, value, options, onChange, buttonLabel, align = 'left',
}: {
  title: string
  value: T
  options: FilterOption<T>[]
  onChange: (v: T) => void
  buttonLabel?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const cur = options.find((o) => o.value === value) ?? options[0]

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={title}
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-navy transition hover:bg-seafoam/60"
      >
        {buttonLabel ?? cur.label}
        <ChevronDown size={14} strokeWidth={2} aria-hidden className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={title}
          className={`absolute top-full z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl border border-line bg-card p-1.5 shadow-raised ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">{title}</p>
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold transition hover:bg-seafoam"
            >
              {o.label}
              {o.value === value && <Check size={16} strokeWidth={2.2} aria-hidden className="ml-auto text-teal" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}