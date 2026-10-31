import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Smartphone, UserRound } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { PasswordField, TextField } from '../components/auth/Fields'
import { useAuth } from '../lib/auth'
import { ROLE_HOME } from '../lib/accounts'
import { useT, type Key } from '../lib/i18n'

const ERRORS: Record<string, Key> = {
  creds: 'auth.err.creds',
  rejected: 'auth.err.rejected',
  suspended: 'auth.err.suspended',
  busy: 'auth.err.busy',
  network: 'auth.err.network',
}

// 09171234567 shows as 0917 123 4567 while typing; anything else (a username) is left alone
const isDigits = (v: string) => /^[\d\s]+$/.test(v)
const fmtPhone = (v: string) => {
  if (!isDigits(v) || !v.trim().startsWith('0')) return v
  const d = v.replace(/\D/g, '').slice(0, 11)
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 11)].filter(Boolean).join(' ')
}

// Landing and login in one screen: type your number and password, or make an account.
export default function Landing() {
  const t = useT()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<Key | null>(null)
  const [busy, setBusy] = useState(false)
  const [tries, setTries] = useState(0)
  const [caps, setCaps] = useState(false)

  // already signed in: go straight to the right home
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id.trim() || !password) {
      setError('auth.err.fill')
      setTries((n) => n + 1)
      return
    }
    setBusy(true)
    setError(null)
    const res = await login(isDigits(id) ? id.replace(/\s+/g, '') : id, password)
    setBusy(false)
    if (res.ok) navigate(ROLE_HOME[res.user.role], { replace: true })
    else {
      setError(ERRORS[res.error] ?? 'auth.err.creds')
      setTries((n) => n + 1)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <h1 className="font-numeral text-[32px] font-bold leading-tight">{t('auth.welcome')}</h1>
          <p className="mt-1 text-ink-soft">{t('auth.login.sub')}</p>
        </div>
        <TextField
          label={t('auth.id')}
          value={id}
          onChange={(e) => setId(fmtPhone(e.target.value))}
          leading={id && !isDigits(id) ? <UserRound size={20} strokeWidth={1.8} /> : <Smartphone size={20} strokeWidth={1.8} />}
          inputMode="tel"
          autoComplete="username"
          placeholder={t('auth.id.ph')}
        />
        <PasswordField
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => setCaps(e.getModifierState('CapsLock'))}
          onKeyUp={(e) => setCaps(e.getModifierState('CapsLock'))}
          hint={caps ? t('auth.caps') : undefined}
          autoComplete="current-password"
        />
        {error && (
          <p key={tries} role="alert" className="anim-shake rounded-md bg-risk-critical-bg p-3 text-base font-semibold text-risk-critical">
            {t(error)}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-coral text-lg font-semibold text-deep shadow-raised transition hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
        >
          {busy && <Loader2 size={22} strokeWidth={2} className="animate-spin" aria-hidden />}
          {busy ? t('auth.signingin') : t('auth.login')}
          {!busy && <ArrowRight size={22} strokeWidth={1.8} aria-hidden className="transition group-hover:translate-x-1" />}
        </button>
      </form>

      <Link
        to="/register"
        className="group mt-6 flex min-h-16 items-center justify-between gap-3 rounded-md border-2 border-line bg-seafoam/60 px-5 py-3 transition hover:border-teal"
      >
        <span>
          <span className="block text-sm text-ink-soft">{t('auth.noaccount')}</span>
          <span className="block font-numeral text-xl font-bold text-teal">{t('auth.create')}</span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal text-on-accent transition group-hover:translate-x-1">
          <ArrowRight size={20} strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </AuthLayout>
  )
}