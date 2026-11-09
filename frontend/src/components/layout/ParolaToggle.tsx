import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

/* The parola: one tap switches between day and night at sea. Its lamp is lit at night. */
export default function ParolaToggle() {
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
      className="hidden size-11 place-items-center rounded-full border border-line transition hover:bg-seafoam/60 sm:grid"
    >
      <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 25 L12.2 12 H15.8 L17 25 Z" />
        <path d="M11.7 18.5 H16.3" />
        <rect x="12" y="8" width="4" height="4" rx="0.8" fill={night ? 'var(--color-coral)' : 'none'} stroke={night ? 'var(--color-coral)' : 'currentColor'} />
        <path d="M11.5 8 L14 5 L16.5 8 Z" />
        <path d="M7.5 25 H20.5" />
        <g stroke="var(--color-coral)" className={night ? 'anim-glow' : ''} opacity={night ? 1 : 0.35}>
          <path d="M10 10 H4.5" />
          <path d="M10.5 7.2 L5.5 5" />
          <path d="M18 10 H23.5" />
          <path d="M17.5 7.2 L22.5 5" />
        </g>
      </svg>
    </button>
  )
}