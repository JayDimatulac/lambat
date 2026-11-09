import { useState, type ReactNode } from 'react'
import { Accessibility, LogOut, Moon, RotateCcw } from 'lucide-react'
import LogoutSheet from '../components/auth/LogoutSheet'
import LangToggle from '../components/layout/LangToggle'
import Segmented from '../components/ui/Segmented'
import SwitchRow from '../components/ui/SwitchRow'
import Disclaimer from '../components/ui/Disclaimer'
import { useCatches } from '../data/store'
import { useT } from '../lib/i18n'
import { useSettings, type Connection } from '../lib/settings'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-4 rounded-lg border border-line bg-card p-5 shadow-rest">
      <h3 className="text-xl">{title}</h3>
      {children}
    </section>
  )
}

export default function Settings() {
  const t = useT()
  const { simple, setSimple, theme, setTheme, connection, setConnection } = useSettings()
  const { resetDemo } = useCatches()
  const [askLogout, setAskLogout] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  return (
    <div className="space-y-5">
      <h1 className="sr-only">{t('nav.settings')}</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={t('settings.appearance')}>
          <div className="space-y-3">
            <SwitchRow icon={<Moon size={24} strokeWidth={1.8} aria-hidden />} label={t('menu.night')} hint={t('menu.night.hint')} checked={theme === 'night'} onChange={(v) => setTheme(v ? 'night' : 'day')} />
            <SwitchRow icon={<Accessibility size={24} strokeWidth={1.8} aria-hidden />} label={t('menu.simple')} hint={t('menu.simple.hint')} checked={simple} onChange={setSimple} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-mint px-4 py-3">
            <div>
              <p className="font-semibold">{t('menu.language')}</p>
              <p className="text-sm text-ink-soft">{t('settings.language.hint')}</p>
            </div>
            <LangToggle />
          </div>
        </Card>

        <div className="space-y-5">
          <Card title={t('conn.demo')}>
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
          </Card>

          <Card title={t('settings.data')}>
            <p className="text-sm text-ink-soft">{t('settings.reset.hint')}</p>
            <button
              type="button"
              onClick={() => { resetDemo(); setResetDone(true) }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-line px-4 text-sm font-semibold text-ink-soft hover:bg-seafoam/50"
            >
              <RotateCcw size={18} strokeWidth={1.8} aria-hidden />
              {resetDone ? t('settings.reset.done') : t('menu.reset')}
            </button>
          </Card>

          <Card title={t('settings.account')}>
            <button
              type="button"
              onClick={() => setAskLogout(true)}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal hover:bg-seafoam/50"
            >
              <LogOut size={22} strokeWidth={1.8} aria-hidden />
              {t('auth.logout')}
            </button>
          </Card>
        </div>
      </div>

      <Disclaimer />
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </div>
  )
}