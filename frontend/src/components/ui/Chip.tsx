import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }

export default function Chip({ active, className = '', ...rest }: Props) {
  return (
    <button
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        active ? 'border-teal bg-teal text-white' : 'border-line bg-seafoam/40 text-navy hover:bg-seafoam'
      } ${className}`}
      {...rest}
    />
  )
}
