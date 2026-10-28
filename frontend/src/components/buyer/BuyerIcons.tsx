import type { ReactNode } from 'react'

// Buyer icons, drawn like the rest of the LAMBAT set: 24px grid, 1.8 stroke, round ends.
type IconProps = { size?: number; strokeWidth?: number; className?: string }

function Svg({ size = 24, strokeWidth = 1.8, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

/** Mga Alok: a fish crate with its slats */
export const CrateIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.4 8.6H20.6V19H3.4Z" />
    <path d="M3.4 8.6L5.4 5H18.6L20.6 8.6" />
    <path d="M9 8.6V19M15 8.6V19" />
    <path d="M6 13.8H6.1M12 13.8H12.1M18 13.8H18.1" strokeWidth={2.4} />
  </Svg>
)

/** Mga Order: a rope with two knots */
export const RopeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.8 14C6 7.4 9.6 7.4 12 12.2T21.2 10" />
    <circle cx="7.4" cy="9.4" r="1.7" />
    <circle cx="16.4" cy="13.2" r="1.7" />
  </Svg>
)

/** Freshness: a lantern with its flame */
export const LanternIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.4 4.4Q12 1.8 14.6 4.4" />
    <path d="M9 4.6H15" />
    <path d="M8.4 6.6H15.6L17 17.2Q17 19.6 12 19.6T7 17.2Z" />
    <path d="M12 9.6Q14.2 12.2 12 14.8Q9.8 12.2 12 9.6Z" />
    <path d="M9.6 22H14.4" />
  </Svg>
)

/** Profile: the stall with its awning */
export const StallIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 9.6L5 4.6H19L21 9.6" />
    <path d="M3 9.6Q5.3 12.6 7.6 9.6T12.2 9.6T16.8 9.6T21 9.6" />
    <path d="M5.2 12.4V20M18.8 12.4V20M3.4 20H20.6" />
  </Svg>
)

/** Rescue buyer: the lifebuoy */
export const LifebuoyIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M5.6 5.6L9.3 9.3M18.4 5.6L14.7 9.3M5.6 18.4L9.3 14.7M18.4 18.4L14.7 14.7" />
  </Svg>
)