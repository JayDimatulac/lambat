import type { ReactNode } from 'react'

/* A fish on a line, tugging at the hook above a little wave. Used while something loads.
   Size 28 to 40 works inline with text; 96 is for a full "please wait" screen.
   With reduced motion the fish just hangs still (the global rule turns the animation off). */
export default function FishLoader({ size = 96, label, className = '' }: { size?: number; label?: ReactNode; className?: string }) {
  return (
    <div role="status" className={`flex flex-col items-center gap-2 text-center text-ink-soft ${className}`}>
      <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden="true">
        <g className="anim-tug">
          <path d="M50 0 V28" stroke="var(--color-ink-soft)" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M50 28 v7 a4.5 4.5 0 1 1 -4.5 -4.5" stroke="var(--color-coral)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <g transform="translate(50 32) rotate(90) scale(0.46) translate(-5 -30)" fill="var(--color-teal)">
            <path d="M5 30C24 14 70 14 98 27L116 15L110 30L116 45L98 33C70 46 24 46 5 30Z" />
            <path d="M44 19L52 11L66 18ZM70 18L78 12L88 22Z" />
            <circle cx="22" cy="28" r="3.5" fill="var(--color-ice)" />
          </g>
        </g>
        <path d="M4 98 q12 -8 23 0 t23 0 t23 0 t23 0" stroke="var(--color-teal)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M4 106 q12 -8 23 0 t23 0 t23 0 t23 0" stroke="var(--color-teal)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3" />
      </svg>
      {label && <p className="text-base">{label}</p>}
    </div>
  )
}