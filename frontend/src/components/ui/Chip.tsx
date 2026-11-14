import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; compact?: boolean }

export default function Chip({ active, compact, className = '', ...rest }: Props) {
  return (
    <button
      aria-pressed={active}
      className={`${compact ? 'min-h-11' : 'min-h-12'} rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        active ? 'border-teal bg-teal text-on-accent' : 'border-line bg-seafoam/40 text-navy hover:bg-seafoam'
      } ${className}`}
      {...rest}
    />
  )
}