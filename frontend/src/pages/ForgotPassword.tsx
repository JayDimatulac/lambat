import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2, Smartphone } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { PasswordField, TextField } from '../components/auth/Fields'
import { forgotPassword, resetPassword, verifyResetCode } from '../lib/otpApi'

type Step = 'mobile' | 'code' | 'password' | 'done'
const COOLDOWN = 60

const BTN =
  'group flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-coral text-lg font-semibold text-deep shadow-raised transition hover:brightness-105 active:scale-[0.98] disabled:opacity-70'

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('mobile')
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // 60-second resend countdown (the server enforces it too)
  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const cleanMobile = mobile.replace(/[\s\-()]/g, '')

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!/^(\+?63|0)?9\d{9}$/.test(cleanMobile)) {
      setError('Enter a valid mobile number, like 09171234567')
      return
    }
    setBusy(true)
    setError(null)
    const res = await forgotPassword(cleanMobile)
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setCode('')
    setCooldown(COOLDOWN)
    setStep('code')
  }

  const checkCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code'); return }
    setBusy(true)
    setError(null)
    const res = await verifyResetCode(cleanMobile, code)
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setResetToken(res.data.resetToken)
    setStep('password')
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8 || pw.length > 72) { setError('Password must be 8 to 72 characters'); return }
    if (pw !== pw2) { setError("The two passwords don't match"); return }
    setBusy(true)
    setError(null)
    const res = await resetPassword(resetToken, pw)
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setPw(''); setPw2(''); setResetToken('')
    setStep('done')
  }

  const startOver = () => {
    setStep('mobile'); setCode(''); setPw(''); setPw2(''); setResetToken(''); setError(null)
  }

  const ErrorBox = () =>
    error ? (
      <p role="alert" className="rounded-md bg-risk-critical-bg p-3 text-base font-semibold text-risk-critical">
        {error}
      </p>
    ) : null

  return (
    <AuthLayout>
      {step === 'mobile' && (
        <form onSubmit={sendCode} className="space-y-5" noValidate>
          <div>
            <h1 className="font-numeral text-[32px] font-bold leading-tight">Forgot your password?</h1>
            <p className="mt-1 text-ink-soft">Enter your mobile number. We'll text you a 6-digit code.</p>
          </div>
          <TextField
            label="Mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            leading={<Smartphone size={20} strokeWidth={1.8} />}
            inputMode="tel"
            autoComplete="tel"
            placeholder="09171234567"
          />
          <ErrorBox />
          <button type="submit" disabled={busy} className={BTN}>
            {busy && <Loader2 size={22} className="animate-spin" aria-hidden />}
            Send code
            {!busy && <ArrowRight size={22} strokeWidth={1.8} aria-hidden />}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={checkCode} className="space-y-5" noValidate>
          <div>
            <h1 className="font-numeral text-[32px] font-bold leading-tight">Enter the code</h1>
            <p className="mt-1 text-ink-soft">
              If this number has an account, we sent a 6-digit code to it. It expires in 5 minutes.
            </p>
          </div>
          <TextField
            label="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            leading={<KeyRound size={20} strokeWidth={1.8} />}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
          />
          <ErrorBox />
          <button type="submit" disabled={busy} className={BTN}>
            {busy && <Loader2 size={22} className="animate-spin" aria-hidden />}
            Verify code
          </button>
          <button
            type="button"
            disabled={cooldown > 0 || busy}
            onClick={() => sendCode()}
            className="w-full text-center text-sm font-semibold text-teal disabled:text-ink-soft"
          >
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={savePassword} className="space-y-5" noValidate>
          <div>
            <h1 className="font-numeral text-[32px] font-bold leading-tight">Choose a new password</h1>
            <p className="mt-1 text-ink-soft">Use 8 or more characters.</p>
          </div>
          <PasswordField label="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          <PasswordField label="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
          <ErrorBox />
          <button type="submit" disabled={busy} className={BTN}>
            {busy && <Loader2 size={22} className="animate-spin" aria-hidden />}
            Save password
          </button>
          {error?.includes('start again') && (
            <button type="button" onClick={startOver} className="w-full text-center text-sm font-semibold text-teal">
              Start again
            </button>
          )}
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-5 text-center">
          <CheckCircle2 size={56} strokeWidth={1.6} className="mx-auto text-teal" aria-hidden />
          <h1 className="font-numeral text-[32px] font-bold leading-tight">Password changed</h1>
          <p className="text-ink-soft">You can now log in with your new password. Other devices were logged out.</p>
          <Link to="/" className={BTN}>
            Go to login
            <ArrowRight size={22} strokeWidth={1.8} aria-hidden />
          </Link>
        </div>
      )}

      {step !== 'done' && (
        <Link to="/" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-ink-soft hover:text-teal">
          <ArrowLeft size={16} aria-hidden /> Back to login
        </Link>
      )}
    </AuthLayout>
  )
}