import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Smartphone } from 'lucide-react'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'

const roles = ['Fisherfolk', 'Buyer', 'Cooperative or fish port', 'Organization']
const field =
  'flex items-center gap-3 rounded-sm border border-line bg-mint px-4 py-3 focus-within:border-teal focus-within:ring-4 focus-within:ring-teal/10'

export default function Login() {
  const nav = useNavigate()
  const [role, setRole] = useState(roles[0])
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="bg-dawn hidden items-end p-12 text-white lg:flex">
        <div className="max-w-lg">
          <h1 className="text-4xl font-semibold leading-tight">Alamin ang kalagayan ng huli. Alamin kung ano pa ang magagawa.</h1>
          <p className="mt-3 text-white/80">AI-Assisted Post-Catch Loss Prevention and Value Recovery Platform</p>
        </div>
      </div>
      <div className="grid place-items-center bg-white p-6">
        <div className="w-full max-w-sm">
          <p className="font-display text-3xl font-bold tracking-wide">LAMBAT</p>
          <p className="mb-6 text-sm text-teal">Para sa ating mga mangingisda</p>
          <h2 className="text-xl">Mag-log in</h2>
          <p className="mb-4 text-sm text-ink-soft">I-enter ang iyong numero at password</p>
          <div className="space-y-3">
            <label className={field}>
              <Smartphone size={20} strokeWidth={1.8} aria-hidden />
              <input className="w-full bg-transparent outline-none" inputMode="tel" placeholder="Mobile number (e.g. 09XX XXX XXXX)" />
            </label>
            <label className={field}>
              <Lock size={20} strokeWidth={1.8} aria-hidden />
              <input className="w-full bg-transparent outline-none" type="password" placeholder="Password" />
            </label>
          </div>
          <Button className="mt-4 w-full py-3.5" onClick={() => nav('/')}>Log in</Button>
          <p className="my-3 text-center text-sm font-semibold text-teal">Register</p>
          <p className="mb-2 text-center text-xs text-ink-soft">I am a…</p>
          <div className="flex flex-wrap justify-center gap-2">
            {roles.map((r) => <Chip key={r} active={r === role} onClick={() => setRole(r)}>{r}</Chip>)}
          </div>
        </div>
      </div>
    </div>
  )
}
