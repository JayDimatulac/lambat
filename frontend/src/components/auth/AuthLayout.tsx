import type { ReactNode } from 'react'
import AuthScene from './AuthScene'
import Segmented from '../ui/Segmented'
import { useSettings, type Lang } from '../../lib/settings'

// The wording on the way in shows in both languages, so a person sees their own language straight away
const TAGLINE = { fil: 'Bantayan ang huli. Iwas sayang.', en: 'Guard your catch. Waste less.' }

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { lang, setLang } = useSettings()
  const main: Lang = lang === 'en' ? 'en' : 'fil'
  const other: Lang = main === 'fil' ? 'en' : 'fil'
  return (
    <div className="min-h-dvh bg-mint lg:grid lg:grid-cols-[1.1fr_1fr]">
      <header className="relative h-[290px] overflow-hidden lg:h-auto lg:min-h-dvh">
        <AuthScene />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <div>
            <p className="font-display text-[34px] font-bold leading-none tracking-wider text-white">LAMBAT</p>
            <p className="mt-2 max-w-[15rem] text-base font-semibold leading-snug text-white">{TAGLINE[main]}</p>
            <p className="mt-0.5 max-w-[15rem] text-sm leading-snug text-white/90">{TAGLINE[other]}</p>
          </div>
          <Segmented<Lang>
            label="Wika / Language"
            value={main}
            onChange={setLang}
            className="shrink-0 bg-card/90"
            options={[
              { value: 'fil', label: 'Filipino', aria: 'Filipino' },
              { value: 'en', label: 'English', aria: 'English' },
            ]}
          />
        </div>
      </header>
      <main className="relative -mt-8 rounded-t-[28px] bg-card px-5 pb-12 pt-7 shadow-raised lg:mt-0 lg:grid lg:place-items-center lg:rounded-none lg:px-12 lg:shadow-none">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}