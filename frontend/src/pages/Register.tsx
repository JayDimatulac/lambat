import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Footprints, Flame, Scale, Store, UtensilsCrossed } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { ChoiceTile, PasswordField, TextField } from '../components/auth/Fields'
import Chip from '../components/ui/Chip'
import { BangkaIcon } from '../components/home/HomeIcons'
import { PierIcon } from '../components/icons'
import { useAuth } from '../lib/auth'
import { ROLE_HOME, looksLikeEmail, normalizeMobile, type Boat, type BuyerType, type Gear, type Ground } from '../lib/accounts'
import { useT, type Key } from '../lib/i18n'

// Edit this list to match the landing places you want people to pick from
const LANDINGS = ['Balayan', 'Calatagan', 'Lemery', 'Tuy', 'Batangas City']
const BOATS: { id: Boat; title: Key; sub: Key }[] = [
  { id: 'motor', title: 'boat.motor', sub: 'boat.motor.sub' },
  { id: 'paddle', title: 'boat.paddle', sub: 'boat.paddle.sub' },
  { id: 'shore', title: 'boat.shore', sub: 'boat.shore.sub' },
]
const GEARS: { id: Gear; label: Key }[] = [
  { id: 'net', label: 'gear.net' }, { id: 'line', label: 'gear.line' }, { id: 'trap', label: 'gear.trap' }, { id: 'other', label: 'gear.other' },
]
const BUYER_TYPES: { id: BuyerType; label: Key; icon: typeof Store }[] = [
  { id: 'market', label: 'party.market', icon: Store }, { id: 'trader', label: 'party.trader', icon: Scale },
  { id: 'restaurant', label: 'party.restaurant', icon: UtensilsCrossed }, { id: 'smokehouse', label: 'party.smokehouse', icon: Flame },
]

type Role = 'fisherfolk' | 'buyer'
type Errors = Partial<Record<'name' | 'mobile' | 'barangay' | 'password' | 'email' | 'landing' | 'biz' | 'type', Key>>

/* A rope with a knot for each step. Answered knots fill in. */
function Knots({ step }: { step: number }) {
  return (
    <div className="relative flex flex-1 items-center justify-between px-1" aria-hidden="true">
      <span className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded bg-line" />
      {[0, 1, 2].map((i) => <span key={i} className={`relative size-4 rounded-full border-2 transition-all ${i <= step ? 'scale-110 border-teal bg-teal' : 'border-line bg-card'}`} />)}
    </div>
  )
}

export default function Register() {
  const t = useT()
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // step 2
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [barangay, setBarangay] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  // step 3, fisherfolk
  const [landing, setLanding] = useState<string | null>(null)
  const [otherLanding, setOtherLanding] = useState('')
  const [boat, setBoat] = useState<Boat | null>(null)
  const [gear, setGear] = useState<Gear[]>([])
  const [ground, setGround] = useState<Ground | null>(null)
  // step 3, buyer
  const [biz, setBiz] = useState('')
  const [btype, setBtype] = useState<BuyerType | null>(null)
  const [address, setAddress] = useState('')

  if (user && !done) return <Navigate to={ROLE_HOME[user.role]} replace />

  const checkBasics = () => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = 'reg.err.name'
    if (!normalizeMobile(mobile)) e.mobile = 'reg.err.mobile'
    if (!barangay.trim()) e.barangay = 'reg.err.barangay'
    if (password.length < 6) e.password = 'reg.err.password'
    if (email.trim() && !looksLikeEmail(email.trim())) e.email = 'reg.err.email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const landingValue = landing === '__other' ? otherLanding.trim() : landing
  const checkStep3 = () => {
    const e: Errors = {}
    if (role === 'fisherfolk' && !landingValue) e.landing = 'reg.err.landing'
    if (role === 'buyer') {
      if (!biz.trim()) e.biz = 'reg.err.biz'
      if (!btype) e.type = 'reg.err.biztype'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const finish = async () => {
    if (!role || !checkStep3()) return
    setBusy(true)
    const res = await register({
      role,
      name: name.trim(),
      mobile: normalizeMobile(mobile)!,
      barangay: barangay.trim(),
      password,
      email: email.trim() || undefined,
      fisher: role === 'fisherfolk' ? { boat, gear, ground, landing: landingValue! } : undefined,
      buyer: role === 'buyer' ? { businessName: biz.trim(), buyerType: btype!, address: address.trim() } : undefined,
    })
    setBusy(false)
    if (!res.ok) {
      setErrors({ mobile: 'reg.err.taken' })
      setStep(1)
    } else if (res.signedIn) navigate(ROLE_HOME[res.user.role], { replace: true })
    else setDone(true)
  }

  const next = () => {
    if (step === 0 && role) setStep(1)
    else if (step === 1 && checkBasics()) setStep(2)
    else if (step === 2) void finish()
  }

  // buyers wait for approval, so they get a clear message instead of a home screen
  if (done) {
    return (
      <AuthLayout>
        <div className="space-y-5 text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-seafoam text-teal"><Clock size={40} strokeWidth={1.8} aria-hidden /></span>
          <h1 className="font-numeral text-[30px] font-bold leading-tight">{t('reg.done.title')}</h1>
          <p className="text-lg">{t('reg.done.text')}</p>
          <Link to="/" className="flex min-h-14 w-full items-center justify-center rounded-full bg-coral text-lg font-semibold text-deep shadow-raised">{t('reg.done.btn')}</Link>
        </div>
      </AuthLayout>
    )
  }

  const toggleGear = (g: Gear) => setGear((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))
  const card = (on: boolean) => `relative flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition active:scale-[0.98] ${on ? 'border-teal bg-seafoam shadow-raised' : 'border-line bg-card'}`

  return (
    <AuthLayout>
      <div className="mb-5 flex items-center gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} aria-label={t('log.back')} className="grid size-12 shrink-0 place-items-center rounded-full hover:bg-seafoam">
            <ArrowLeft size={24} strokeWidth={1.8} aria-hidden />
          </button>
        ) : (
          <Link to="/" aria-label={t('log.back')} className="grid size-12 shrink-0 place-items-center rounded-full hover:bg-seafoam">
            <ArrowLeft size={24} strokeWidth={1.8} aria-hidden />
          </Link>
        )}
        <Knots step={step} />
        <span className="w-24 shrink-0 text-right text-sm text-ink-soft">{t('log.step', { n: step + 1, total: 3 })}</span>
      </div>

      <div key={step} className="anim-rise space-y-5">
        {step === 0 && (
          <>
            <h1 className="font-numeral text-[30px] font-bold leading-tight">{t('reg.who')}</h1>
            <div role="radiogroup" aria-label={t('reg.who')} className="space-y-3">
              <button type="button" role="radio" aria-checked={role === 'fisherfolk'} onClick={() => setRole('fisherfolk')} className={card(role === 'fisherfolk')}>
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-coral text-deep"><BangkaIcon size={44} /></span>
                <span>
                  <span className="block font-numeral text-[26px] font-bold leading-tight">{t('reg.fisher')}</span>
                  <span className="block text-base leading-snug">{t('reg.fisher.sub')}</span>
                </span>
              </button>
              <button type="button" role="radio" aria-checked={role === 'buyer'} onClick={() => setRole('buyer')} className={card(role === 'buyer')}>
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-teal text-on-accent"><PierIcon size={40} /></span>
                <span>
                  <span className="block font-numeral text-[26px] font-bold leading-tight">{t('reg.buyer')}</span>
                  <span className="block text-base leading-snug">{t('reg.buyer.sub')}</span>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-xs font-bold"><Clock size={14} strokeWidth={2} aria-hidden />{t('reg.buyer.tag')}</span>
                </span>
              </button>
            </div>
            <p className="rounded-md border border-dashed border-teal/50 bg-seafoam/50 p-3 text-sm leading-snug">{t('reg.org')}</p>
            <p className="text-center text-base">{t('reg.have')} <Link to="/" className="font-bold text-teal underline underline-offset-4">{t('auth.login')}</Link></p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-numeral text-[30px] font-bold leading-tight">{t('reg.basics')}</h1>
            <TextField label={t('reg.name')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name && t(errors.name)} />
            <TextField label={t('reg.mobile')} hint={t('reg.mobile.hint')} value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" autoComplete="tel" placeholder={t('auth.id.ph')} error={errors.mobile && t(errors.mobile)} />
            <TextField label={t('reg.barangay')} value={barangay} onChange={(e) => setBarangay(e.target.value)} placeholder={t('reg.barangay.ph')} error={errors.barangay && t(errors.barangay)} />
            <PasswordField label={t('reg.password')} hint={t('reg.password.hint')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" error={errors.password && t(errors.password)} />
            {showEmail ? (
              <TextField label={t('reg.email')} value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" error={errors.email && t(errors.email)} />
            ) : (
              <button type="button" onClick={() => setShowEmail(true)} className="min-h-12 text-base font-semibold text-teal underline underline-offset-4">{t('reg.email.add')}</button>
            )}
          </>
        )}

        {step === 2 && role === 'fisherfolk' && (
          <>
            <h1 className="font-numeral text-[30px] font-bold leading-tight">{t('reg.fisher.title')}</h1>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{t('reg.landing')}</p>
              <p className="text-sm text-ink-soft">{t('reg.landing.hint')}</p>
              <div role="radiogroup" aria-label={t('reg.landing')} className="space-y-2">
                {LANDINGS.map((p) => <ChoiceTile key={p} selected={landing === p} onClick={() => setLanding(p)} icon={<PierIcon size={26} />} title={p} />)}
                <ChoiceTile selected={landing === '__other'} onClick={() => setLanding('__other')} title={t('reg.landing.other')} />
              </div>
              {landing === '__other' && <TextField label={t('reg.landing.other.ph')} value={otherLanding} onChange={(e) => setOtherLanding(e.target.value)} />}
              {errors.landing && <p role="alert" className="text-sm font-semibold text-risk-critical">{t(errors.landing)}</p>}
            </div>

            <div className="space-y-4 rounded-lg border border-dashed border-line p-4">
              <p className="text-sm font-bold uppercase tracking-wider text-ink-soft">{t('reg.optional')}</p>
              <div className="space-y-2">
                <p className="text-base font-semibold">{t('reg.boat')}</p>
                <div role="radiogroup" aria-label={t('reg.boat')} className="space-y-2">
                  {BOATS.map((b) => (
                    <ChoiceTile key={b.id} selected={boat === b.id} onClick={() => setBoat(boat === b.id ? null : b.id)} icon={b.id === 'shore' ? <Footprints size={26} strokeWidth={1.8} /> : <BangkaIcon size={30} />} title={t(b.title)} sub={t(b.sub)} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold">{t('reg.gear')}</p>
                <div className="flex flex-wrap gap-2">{GEARS.map((g) => <Chip key={g.id} active={gear.includes(g.id)} onClick={() => toggleGear(g.id)}>{t(g.label)}</Chip>)}</div>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold">{t('reg.ground')}</p>
                <div className="flex flex-wrap gap-2">
                  <Chip active={ground === 'near'} onClick={() => setGround(ground === 'near' ? null : 'near')}>{t('ground.near')}</Chip>
                  <Chip active={ground === 'open'} onClick={() => setGround(ground === 'open' ? null : 'open')}>{t('ground.open')}</Chip>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && role === 'buyer' && (
          <>
            <h1 className="font-numeral text-[30px] font-bold leading-tight">{t('reg.buyer.title')}</h1>
            <TextField label={t('reg.biz')} value={biz} onChange={(e) => setBiz(e.target.value)} error={errors.biz && t(errors.biz)} />
            <div className="space-y-2">
              <p className="text-lg font-semibold">{t('reg.biztype')}</p>
              <div role="radiogroup" aria-label={t('reg.biztype')} className="space-y-2">
                {BUYER_TYPES.map((b) => <ChoiceTile key={b.id} selected={btype === b.id} onClick={() => setBtype(b.id)} icon={<b.icon size={26} strokeWidth={1.8} />} title={t(b.label)} />)}
              </div>
              {errors.type && <p role="alert" className="text-sm font-semibold text-risk-critical">{t(errors.type)}</p>}
            </div>
            <TextField label={t('reg.address')} hint={t('reg.address.hint')} value={address} onChange={(e) => setAddress(e.target.value)} />
            <p className="flex items-start gap-2 rounded-md bg-seafoam p-3 text-sm leading-snug"><Clock size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-teal" aria-hidden />{t('reg.buyer.tag')}: {t('reg.buyer.note')}</p>
          </>
        )}

        <button type="button" onClick={next} disabled={(step === 0 && !role) || busy} className="flex min-h-14 w-full items-center justify-center rounded-full bg-coral text-lg font-semibold text-deep shadow-raised transition active:scale-[0.98] disabled:opacity-40">
          {step === 2 ? (busy ? t('reg.sending') : t('reg.finish')) : t('log.next')}
        </button>
      </div>
    </AuthLayout>
  )
}