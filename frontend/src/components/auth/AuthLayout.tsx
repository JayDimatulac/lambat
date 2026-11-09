import type { ReactNode } from 'react'
import { CloudSun, Fish, Moon, Sun, Users } from 'lucide-react'
import AuthLighthouse from './AuthLighthouse'
import Logo from '../Logo'
import Segmented from '../ui/Segmented'
import { useSettings, type Lang } from '../../lib/settings'
import { useT } from '../../lib/i18n'

const COPY = {
  fil: {
    tag: 'Katuwang ng Mangingisdang Pilipino',
    eyebrow: 'Para sa ating mangingisda',
    head: ['Bawat huli,', 'may pag-asa.'],
    sub: 'Mula sa dagat hanggang sa pamilihan, kasama mo kami sa pagprotekta ng iyong huli at kabuhayan.',
    feats: ['Bantayan ang huli', 'Maghanda sa panahon', 'Komunekta sa mamimili'],
  },
  en: {
    tag: 'Partner of Filipino Fisherfolk',
    eyebrow: 'For our fisherfolk',
    head: ['Every catch,', 'carries hope.'],
    sub: 'From ocean to market, we stand with you to protect your catch and livelihood.',
    feats: ['Guard the catch', 'Prepare for weather', 'Connect to buyers'],
  },
}

const FEAT_ICONS = [Fish, CloudSun, Users]

function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useSettings()
  const main: Lang = lang === 'en' ? 'en' : 'fil'
  return (
    <Segmented<Lang>
      label="Wika / Language"
      value={main}
      onChange={setLang}
      className={className}
      options={[
        { value: 'fil', label: 'Filipino', aria: 'Filipino' },
        { value: 'en', label: 'English', aria: 'English' },
      ]}
    />
  )
}

function ThemeButton() {
  const t = useT()
  const { theme, setTheme } = useSettings()
  const night = theme === 'night'
  return (
    <button
      type="button"
      aria-pressed={night}
      aria-label={t('menu.night')}
      title={t('menu.night')}
      onClick={() => setTheme(night ? 'day' : 'night')}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-card/90 text-navy transition hover:bg-seafoam/60"
    >
      {night ? <Moon size={22} strokeWidth={1.8} aria-hidden /> : <Sun size={22} strokeWidth={1.8} aria-hidden />}
    </button>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { lang, theme } = useSettings()
  const main: Lang = lang === 'en' ? 'en' : 'fil'
  const c = COPY[main]
  const night = theme === 'night'

  // text sits on a light sky by day and a dark sky by night
  const ink = night ? 'text-white' : 'text-deep'
  const inkSoft = night ? 'text-white/80' : 'text-deep/80'
  const pill = night ? 'border-white/15 bg-white/5 text-coral' : 'border-deep/15 bg-white/60 text-coral-dark'
  const card = night ? 'border-white/10 bg-white/5 text-white' : 'border-deep/10 bg-white/60 text-deep'
  const iconBg = night ? 'bg-white/10 text-coral' : 'bg-white text-coral-dark'

  return (
    <div className="min-h-dvh bg-mint lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* left: the parola scene, with the headline */}
      <header className="relative h-[330px] overflow-hidden bg-deep lg:sticky lg:top-0 lg:h-dvh">
        <AuthLighthouse />
        <div className="absolute inset-0 flex flex-col p-6 lg:p-12">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <Logo size={64} className="lg:size-20" />
              <div className="hidden lg:block">
                <p className={`font-display text-4xl font-semibold tracking-[0.08em] ${ink}`}>LAMBAT</p>
                <p className={`text-sm ${inkSoft}`}>{c.tag}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              <ThemeButton />
              <LangSwitch className="bg-card/90" />
            </div>
          </div>

          <div className="mt-4 max-w-[16rem] lg:mt-14 lg:max-w-xl">
            <p className={`mb-5 hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] lg:inline-flex ${pill}`}>
              <span className="size-1.5 rounded-full bg-coral" aria-hidden />
              {c.eyebrow}
            </p>
            <h2 className={`font-display text-[26px] font-semibold leading-tight lg:text-6xl lg:leading-[1.05] ${ink}`}>
              {c.head[0]} <br className="hidden lg:block" />
              {c.head[1]}
            </h2>
            <p className={`mt-5 hidden max-w-lg text-lg leading-snug lg:block ${inkSoft}`}>{c.sub}</p>

            <ul className="mt-8 hidden grid-cols-3 gap-3 lg:grid">
              {c.feats.map((label, i) => {
                const Icon = FEAT_ICONS[i]
                return (
                  <li key={label} className={`flex flex-col items-center gap-3 rounded-lg border p-4 text-center text-sm font-semibold leading-snug backdrop-blur-sm ${card}`}>
                    <span className={`grid size-12 place-items-center rounded-full ${iconBg}`}>
                      <Icon size={24} strokeWidth={1.6} aria-hidden />
                    </span>
                    {label}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </header>

      {/* right: the form (follows the day/night theme) */}
      <main className="relative -mt-8 overflow-hidden rounded-t-[28px] bg-card px-5 pb-12 pt-7 shadow-raised lg:mt-0 lg:grid lg:place-items-center lg:rounded-none lg:bg-mint lg:px-12 lg:py-10 lg:shadow-none">
        <div aria-hidden className="net-mesh pointer-events-none absolute inset-0" style={{ maskImage: 'radial-gradient(circle at 100% 0%, #000, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle at 100% 0%, #000, transparent 55%)' }} />
        <div className="relative mx-auto w-full max-w-md">
          <div className="mb-6 hidden items-center justify-end gap-2 lg:flex">
            <ThemeButton />
            <LangSwitch />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}