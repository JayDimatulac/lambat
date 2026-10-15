import type { Shape } from '../data/mock'

// Five silhouettes cover the species table: tuna, scad (galunggong family), sardine, mackerel, moonfish.
const BODY: Record<Shape, string> = {
  tuna: 'M6 31C20 9 62 7 94 25L114 10C108 24 108 38 114 52L94 37C62 55 20 53 6 31Z',
  scad: 'M5 30C24 14 70 14 98 27L116 15L110 30L116 45L98 33C70 46 24 46 5 30Z',
  sardine: 'M8 30C24 19 72 19 102 28L116 20L111 30L116 40L102 32C72 41 24 41 8 30Z',
  mackerel: 'M5 30C24 15 70 15 98 27L116 16L110 30L116 44L98 33C70 45 24 45 5 30Z',
  moon: 'M18 30C18 6 82 6 94 30C82 54 18 54 18 30ZM94 30L114 12C107 25 107 35 114 48Z',
}

const FINS: Record<Shape, string> = {
  tuna: 'M50 16L58 4L68 18ZM58 44L64 54L72 42Z',
  scad: 'M44 19L52 11L66 18ZM70 18L78 12L88 22Z',
  sardine: 'M52 21L58 14L68 22Z',
  mackerel: 'M40 19L48 11L62 18ZM66 18L72 12L82 20ZM90 25L94 20L97 26ZM92 34L96 40L99 33Z',
  moon: 'M44 12L52 0L64 10ZM44 48L52 60L64 50Z',
}

export default function FishShape({ shape, className = '' }: { shape: Shape; className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden="true" fill="currentColor">
      <path d={BODY[shape]} />
      <path d={FINS[shape]} />
      <circle cx={shape === 'moon' ? 32 : 22} cy="28" r="3" style={{ fill: 'var(--color-ice)' }} />
    </svg>
  )
}