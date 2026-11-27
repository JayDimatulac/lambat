import { MapPin } from 'lucide-react'
import { useSettings } from '../../lib/settings'
// To use the bangka + lighthouse art: drop your images into assets/bg and change these two imports.
import dayImg from '../../assets/bg/parola-day.webp'
import nightImg from '../../assets/bg/parola-night.webp'

/* Phone-only hero: greeting, place, and the harbor picture. Desktop keeps the sea chart instead. */
export default function HomeHero({ greeting, name, place }: { greeting: string; name: string; place?: string }) {
  const { theme } = useSettings()
  const night = theme === 'night'
  return (
    <section className="relative h-42 overflow-hidden rounded-3xl border border-line shadow-rest">
      <img
        src={night ? nightImg : dayImg}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 size-full object-cover object-[50%_20%]"
      />
      {/* keeps the white text readable over the sky */}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-deep/70 via-deep/30 to-transparent" />
      <div className="relative z-10 p-4">
        <h1 className="font-numeral text-2xl font-bold leading-tight text-white">
          {greeting}, {name} <span aria-hidden="true">👋</span>
        </h1>
        {place && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/95">
            <MapPin size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            {place}
          </p>
        )}
      </div>
    </section>
  )
}