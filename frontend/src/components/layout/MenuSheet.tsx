import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Accessibility, LogOut, Moon, RotateCcw, Settings, Sparkles, UserRound, X } from 'lucide-react'
import { useSettings, type Connection } from '../../lib/settings'
import { useT } from '../../lib/i18n'
import { useUser } from '../../lib/auth'
import LogoutSheet from '../auth/LogoutSheet'
import { useCatches } from '../../data/store'
import Segmented from '../ui/Segmented'
import LangToggle from './LangToggle'

function SwitchRow({ icon, label, hint, checked, onChange }: { icon: ReactNode; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 rounded-md border border-line bg-mint px-4 py-3 text-left"
    >
      <span className="text-teal">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
      <span aria-hidden="true" className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-teal' : 'bg-line'}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-card shadow-rest transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  )
}

export default function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const { simple, setSimple, theme, setTheme, connection, setConnection } = useSettings()
  const { resetDemo } = useCatches()
  const user = useUser()
  const [askLogout, setAskLogout] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const links = [
    { to: '/value-added', label: t('nav.value'), icon: <Sparkles size={22} strokeWidth={1.8} aria-hidden /> },
    { to: '/profile', label: t('nav.profile'), icon: <UserRound size={22} strokeWidth={1.8} aria-hidden /> },
    { to: '/settings', label: t('nav.settings'), icon: <Settings size={22} strokeWidth={1.8} aria-hidden /> },
  ]

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('hdr.menu')}>
      <button type="button" className="absolute inset-0 bg-deep/50" aria-label={t('menu.close')} onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] space-y-5 overflow-y-auto rounded-t-lg bg-card p-5 shadow-raised lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[380px] lg:rounded-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-teal font-bold text-on-accent">{user.initials}</span>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-ink-soft">{user.fisher?.landing ?? user.barangay}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t('menu.close')} className="grid size-12 place-items-center rounded-full hover:bg-seafoam">
            <X size={24} strokeWidth={1.8} aria-hidden />
          </button>
        </div>

        <div className="space-y-3">
          <SwitchRow icon={<Accessibility size={24} strokeWidth={1.8} aria-hidden />} label={t('menu.simple')} hint={t('menu.simple.hint')} checked={simple} onChange={setSimple} />
          <SwitchRow icon={<Moon size={24} strokeWidth={1.8} aria-hidden />} label={t('menu.night')} hint={t('menu.night.hint')} checked={theme === 'night'} onChange={(v) => setTheme(v ? 'night' : 'day')} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">{t('menu.language')}</p>
          <LangToggle />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">{t('conn.demo')}</p>
          <Segmented<Connection>
            label={t('conn.demo')}
            value={connection}
            onChange={setConnection}
            options={[
              { value: 'online', label: t('conn.online') },
              { value: 'weak', label: t('conn.weak') },
              { value: 'offline', label: t('conn.offline') },
            ]}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-soft">{t('menu.more')}</p>
          <button type="button" onClick={() => { resetDemo(); onClose() }} className="mb-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-line px-4 text-sm font-semibold text-ink-soft hover:bg-seafoam/50">
            <RotateCcw size={18} strokeWidth={1.8} aria-hidden />
            {t('menu.reset')}
          </button>
          <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={onClose} className="flex min-h-14 items-center gap-3 px-4 hover:bg-seafoam/50">
                  <span className="text-teal">{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <button type="button" onClick={() => setAskLogout(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal">
          <LogOut size={22} strokeWidth={1.8} aria-hidden />
          {t('auth.logout')}
        </button>
      </div>

      <LogoutSheet open={askLogout} onClose={() => { setAskLogout(false); onClose() }} />
    </div>
  )
}