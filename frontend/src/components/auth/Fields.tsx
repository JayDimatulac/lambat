import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { useT } from '../../lib/i18n'

const inputCls = 'min-h-14 w-full rounded-md border-2 bg-card px-4 text-lg text-navy placeholder:text-ink-soft/70 focus:border-teal focus:outline-none'

type FieldProps = { label: string; hint?: string; error?: string | null }

export function TextField({ label, hint, error, className = '', ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-semibold">{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} className={`${inputCls} ${error ? 'border-risk-critical-line' : 'border-line'} ${className}`} {...rest} />
      {error ? <p id={`${id}-e`} role="alert" className="text-sm font-semibold text-risk-critical">{error}</p> : hint ? <p id={`${id}-h`} className="text-sm text-ink-soft">{hint}</p> : null}
    </div>
  )
}

// A password box with a button to show what you typed, because mistakes are easy on a small phone
export function PasswordField({ label, hint, error, ...rest }: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const t = useT()
  const id = useId()
  const [shown, setShown] = useState(false)
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-semibold">{label}</label>
      <div className="relative">
        <input id={id} type={shown ? 'text' : 'password'} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} className={`${inputCls} pr-14 ${error ? 'border-risk-critical-line' : 'border-line'}`} {...rest} />
        <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? t('auth.hide') : t('auth.show')} aria-pressed={shown} className="absolute right-1 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full text-teal">
          {shown ? <EyeOff size={22} strokeWidth={1.8} aria-hidden /> : <Eye size={22} strokeWidth={1.8} aria-hidden />}
        </button>
      </div>
      {error ? <p id={`${id}-e`} role="alert" className="text-sm font-semibold text-risk-critical">{error}</p> : hint ? <p id={`${id}-h`} className="text-sm text-ink-soft">{hint}</p> : null}
    </div>
  )
}

type TileProps = { selected: boolean; onClick: () => void; icon?: ReactNode; title: string; sub?: string; role?: 'radio' | 'checkbox' }

// A big tap target for a choice. Picture first, words second.
export function ChoiceTile({ selected, onClick, icon, title, sub, role = 'radio' }: TileProps) {
  return (
    <button type="button" role={role} aria-checked={selected} onClick={onClick} className={`relative flex min-h-16 w-full items-center gap-3 rounded-md border-2 p-3 text-left transition active:scale-[0.98] ${selected ? 'border-teal bg-seafoam' : 'border-line bg-card'}`}>
      {icon && <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mint text-teal">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight">{title}</span>
        {sub && <span className="block text-sm text-ink-soft">{sub}</span>}
      </span>
      {selected && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal text-on-accent"><Check size={16} strokeWidth={3} aria-hidden /></span>}
    </button>
  )
}