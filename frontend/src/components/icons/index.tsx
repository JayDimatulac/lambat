import type { ReactNode } from 'react'

// LAMBAT icon set: 24px grid, 1.8 stroke, round ends, slightly hand-drawn curves.
// Generic icons (bell, wind, ...) stay on Lucide with the same stroke so the set looks like one family.
export type IconProps = { size?: number; strokeWidth?: number; className?: string }

function Svg({ size = 24, strokeWidth = 1.8, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const BuoyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8V8.6" />
    <path d="M12 2.8L16.8 4.6L12 6.4" />
    <path d="M6.6 14.4C6.6 11 9 8.8 12 8.8S17.4 11 17.4 14.4C17.4 17.6 15 19.6 12 19.6S6.6 17.6 6.6 14.4Z" />
    <path d="M7 13.8Q12 16.2 17 13.8" />
    <path d="M3 22Q4.8 20.6 6.6 22T10.2 22T13.8 22T17.4 22T21 22" />
  </Svg>
)

export const TideIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.2 11.5A4.8 4.8 0 0 1 16.8 11.5" />
    <path d="M12 4V5.4M5.2 6.6L6.2 7.6M18.8 6.6L17.8 7.6" />
    <path d="M3 14.8Q4.8 13.2 6.6 14.8T10.2 14.8T13.8 14.8T17.4 14.8T21 14.8" />
    <path d="M3 19.2Q4.8 17.6 6.6 19.2T10.2 19.2T13.8 19.2T17.4 19.2T21 19.2" />
  </Svg>
)

export const FishIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.8 12.2C5.6 7 12.6 6.8 16.4 12C12.8 17.4 5.8 17.4 2.8 12.2Z" />
    <path d="M16.4 12L21.2 8.2V15.9Z" />
    <path d="M7.2 11.4H7.3" strokeWidth={2.4} />
  </Svg>
)

export const PierIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.8 9.6H21.2" />
    <path d="M6 9.6V17.4M12 9.6V17.6M18 9.6V17.4" />
    <path d="M6 6.2H18" />
    <path d="M2.8 20.6Q4.6 19.2 6.4 20.6T10 20.6T13.6 20.6T17.2 20.6T21 20.6" />
  </Svg>
)

export const TrayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.2 8C3.2 6.6 4.2 5.8 5.6 5.8H18.4C19.8 5.8 20.8 6.6 20.8 8V16.2C20.8 17.6 19.8 18.4 18.4 18.4H5.6C4.2 18.4 3.2 17.6 3.2 16.2Z" />
    <path d="M7.4 12.2C9 9.8 12.2 9.8 14 12.2C12.2 14.6 9 14.6 7.4 12.2Z" />
    <path d="M14 12.2L16.6 10.4V14Z" />
  </Svg>
)

export const RowsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.4 7H20M9.4 12H20M9.4 17H20" />
    <path d="M4.6 7H4.7M4.6 12H4.7M4.6 17H4.7" strokeWidth={2.6} />
  </Svg>
)

// A plus with a hand-drawn wobble, for the float button
export const KnotPlusIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.4}>
    <path d="M12 5.2C12.3 8.8 11.7 15.2 12 18.8" />
    <path d="M5.2 12C8.8 11.7 15.2 12.3 18.8 12" />
  </Svg>
)