import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }

export default function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'inline-flex min-h-12 min-w-[88px] items-center justify-center gap-2 rounded-full px-5 py-[9px] text-sm font-semibold transition duration-100 ease-in active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-coral text-deep hover:bg-coral-dark hover:text-white'
      : 'border border-teal bg-transparent text-navy hover:bg-seafoam'
  return <button className={`${base} ${styles} ${className}`} {...rest} />
}