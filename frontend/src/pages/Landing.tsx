import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { PasswordField, TextField } from '../components/auth/Fields'
import { useAuth } from '../lib/auth'
import { DEMO_LOGINS, ROLE_HOME } from '../lib/accounts'
import { useT, type Key } from '../lib/i18n'

const ERRORS: Record<string, Key> = { creds: 'auth.err.creds', rejected: 'auth.err.rejected', suspended: 'auth.err.suspended' }
const DEMO_LABEL: Record<string, Key> = { fisher: 'auth.demo.fisher', buyer: 'auth.demo.buyer', buyerok: 'auth.demo.buyerok', buyerno: 'auth.demo.buyerno', admin: 'auth.demo.admin' }

// Landing and login in one screen: type your number and password, or make an account.
export default function Landing() {
  const t = useT()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<Key | null>(null)
  const [busy, setBusy] = useState(false)

  // already signed in: go straight to the right home
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id.trim() || !password) {
      setError('auth.err.fill')
      return
    }
    setBusy(true)
    setError(null)
    const res = await login(id, password)
    setBusy(false)
    if (res.ok) navigate(ROLE_HOME[res.user.role], { replace: true })
    else setError(ERRORS[res.error])
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <h1 className="font-numeral text-[32px] font-bold leading-tight">{t('auth.welcome')}</h1>
          <p className="mt-1 text-ink-soft">{t('auth.login.sub')}</p>
        </div>

        <TextField label={t('auth.id')} value={id} onChange={(e) => setId(e.target.value)} inputMode="tel" autoComplete="username" placeholder={t('auth.id.ph')} />
        <PasswordField label={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

        {error && <p role="alert" className="rounded-md bg-risk-critical-bg p-3 text-base font-semibold text-risk-critical">{t(error)}</p>}

        <button type="submit" disabled={busy} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-coral text-lg font-semibold text-deep shadow-raised transition active:scale-[0.98] disabled:opacity-60">
          {busy ? t('auth.signingin') : t('auth.login')}
          {!busy && <ArrowRight size={22} strokeWidth={1.8} aria-hidden />}
        </button>
      </form>

      <div className="mt-6 rounded-md bg-seafoam p-4 text-center">
        <p className="text-base">{t('auth.noaccount')}</p>
        <Link to="/register" className="mt-1 inline-flex min-h-12 items-center gap-2 font-numeral text-xl font-bold text-teal underline underline-offset-4">
          {t('auth.create')}
          <ArrowRight size={20} strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <details className="mt-6 rounded-md border border-dashed border-line p-3 text-sm">
        <summary className="min-h-10 cursor-pointer py-2 font-semibold text-ink-soft">{t('auth.demo')}</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_LOGINS.map((d) => (
            <button key={d.key} type="button" onClick={() => { setId(d.id); setPassword(d.password); setError(null) }} className="min-h-12 rounded-full border-2 border-teal px-4 font-semibold text-teal">
              {t(DEMO_LABEL[d.key])}
            </button>
          ))}
        </div>
      </details>
    </AuthLayout>
  )
}