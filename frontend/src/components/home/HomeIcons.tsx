import type { ReactNode } from 'react'

// LAMBAT home icon set: stroke icons on a 32 grid, round ends, same hand-drawn feel as the rest of the app.
export const FISH = 'M2 19 C6 12 13 10 19 14 L24 10 V26 L19 22 C13 26 6 24 2 19 Z'

export type IconProps = { size?: number; className?: string }

function Svg({ size = 24, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  )
}

/** Naibenta: fish with a coin */
export function SoldFishIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g transform="translate(0 3)">
        <path d={FISH} />
        <circle cx="8" cy="17.5" r="1" fill="currentColor" stroke="none" />
      </g>
      <circle cx="25" cy="7" r="4.5" />
      <path d="M23.2 7h3.6" />
    </Svg>
  )
}

/** Naipamahagi: fish in a basket (bilao) */
export function SharedFishIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g transform="translate(0 -4)">
        <path d={FISH} />
        <circle cx="8" cy="17.5" r="1" fill="currentColor" stroke="none" />
      </g>
      <path d="M4 24H28L25 29H7Z" />
      <path d="M13 24V29M19 24V29" />
    </Svg>
  )
}

/** Nasayang: a fish skeleton */
export function LostFishIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 13L8 16L3 19Z" />
      <path d="M8 16H24" />
      <path d="M12 16L10 11M12 16L10 21M16 16L14 10M16 16L14 22M20 16L18 11M20 16L18 21" />
      <path d="M24 16L29 11M24 16L29 21" />
    </Svg>
  )
}

/** Location: a marker buoy riding the water */
export function BuoyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 3V8" />
      <path d="M10 9H22L25 22H7Z" />
      <path d="M8.6 15.5H23.4" />
      <path d="M3 27q3.5-3 7 0t7 0t7 0t5 0" />
    </Svg>
  )
}

/** Wind: a flag snapping in the breeze */
export function PennantIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 4V28" />
      <path d="M6 6C12 3 18 9 26 6V16C18 19 12 13 6 16" />
    </Svg>
  )
}

/** Arrow whose shaft is a wave */
export function WaveArrow(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 16q3-4 6 0t6 0t6 0t6 0" />
      <path d="M21 9L28 16L21 23" />
    </Svg>
  )
}

/** Itala ang Huli: a bangka (outrigger boat) landing its catch */
export function BangkaIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 18C9 22 23 22 27 18Z" />
      <path d="M16 18V5" />
      <path d="M16 5L25 16H16" />
      <path d="M10 20L4.5 24.5M22 20L27.5 24.5" />
      <path d="M1.5 26.5H8M24 26.5H30.5" />
      <path d="M3 30q2.2-2 4.4 0t4.4 0t4.4 0t4.4 0t4.4 0t4.4 0" />
    </Svg>
  )
}