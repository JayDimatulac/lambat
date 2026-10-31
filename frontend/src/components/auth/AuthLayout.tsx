import type { ReactNode } from 'react'
import AuthScene, { NetMark } from './AuthScene'
import Segmented from '../ui/Segmented'
import { useSettings, type Lang } from '../../lib/settings'

// The headline says what the app is for. Both languages show, so a person sees their own straight away.
const HEAD = { fil: 'Alamin kung gaano pa katagal ang huli mo.', en: 'Know how long your catch will keep.' }

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { lang, setLang } = useSettings()
  const main: Lang = lang === 'en' ? 'en' : 'fil'
  const other: Lang = main === 'fil' ? 'en' : 'fil'

  return (
    <div className="min-h-dvh bg-mint lg:grid lg:grid-cols-[1.1fr_1fr]">
      <header className="relative h-[300px] overflow-hidden bg-deep lg:h-auto lg:min-h-dvh">
        <AuthScene />
        <div className="absolute inset-0 flex flex-col justify-between p-6 pb-14 lg:p-14">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <NetMark className="size-9 shrink-0 text-seafoam lg:size-11" />
              <span className="font-display text-[34px] font-semibold leading-none tracking-tight text-white lg:text-[44px]">Lambat</span>
            </div>
            <Segmented<Lang>
              label="Wika / Language"
              value={main}
              onChange={setLang}
              className="shrink-0 bg-card/90 lg:hidden"
              options={[
                { value: 'fil', label: 'Filipino', aria: 'Filipino' },
                { value: 'en', label: 'English', aria: 'English' },
              ]}
            />
          </div>

          <div className="max-w-[12rem] lg:max-w-md">
            <p className="font-display text-[22px] font-medium leading-tight text-white lg:text-4xl lg:leading-[1.15]">{HEAD[main]}</p>
            <p className="mt-2 text-sm leading-snug text-white/70 lg:text-base">{HEAD[other]}</p>
          </div>
        </div>
      </header>

      <main className="relative -mt-8 overflow-hidden rounded-t-[28px] bg-card px-5 pb-12 pt-7 shadow-raised lg:mt-0 lg:grid lg:place-items-center lg:rounded-none lg:px-12 lg:shadow-none">
        {/* the fishing-net motif fades in from the corner */}
        <div aria-hidden className="net-mesh pointer-events-none absolute inset-0" style={{ maskImage: 'radial-gradient(circle at 100% 0%, #000, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle at 100% 0%, #000, transparent 55%)' }} />
        <div className="relative mx-auto w-full max-w-md">
          <div className="mb-6 hidden justify-end lg:flex">
            <Segmented<Lang>
              label="Wika / Language"
              value={main}
              onChange={setLang}
              options={[
                { value: 'fil', label: 'Filipino', aria: 'Filipino' },
                { value: 'en', label: 'English', aria: 'English' },
              ]}
            />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}