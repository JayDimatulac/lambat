import type { ReactNode } from 'react'

// Harbor-master symbol set. Same family as the fisherfolk icons: 24 grid, 1.8 stroke, round ends, hand-drawn curves.
// Every symbol is a real thing from the pier, not a generic interface glyph.
export type IconProps = { size?: number; strokeWidth?: number; className?: string }

function Svg({ size = 24, strokeWidth = 1.8, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

const wave = (y: number) => `M3 ${y}Q4.8 ${y - 1.4} 6.6 ${y}T10.2 ${y}T13.8 ${y}T17.4 ${y}T21 ${y}`

/** Overview: the harbor's signal mast, flying its flags */
export const SignalMastIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 3.2V19.4" />
    <path d="M11 4.4L18.6 6.2L11 8.2" />
    <path d="M11 10.4L16.4 11.6L11 13" />
    <path d="M7 19.4H15" />
    <path d={wave(22)} />
  </Svg>
)

/** Verifications: a bollard with its mooring line. An approved account may tie up at the pier */
export const MooringIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.6 6.6H15.4" />
    <path d="M9.6 6.6V16.4M14.4 6.6V16.4" />
    <path d="M7.4 16.4H16.6" />
    <path d="M9.6 10.2Q12 11.8 14.4 10.2" />
    <path d="M9.6 12.8Q12 14.4 14.4 12.8" />
    <path d="M9.6 13.2C7 13.6 5.4 15.4 3.4 14.6" />
    <path d={wave(21)} />
  </Svg>
)

/** Catches: a fish hanging on the line */
export const StringerIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.8 2.8H14.2" />
    <path d="M12 2.8V7.8" />
    <path d="M12 7.8C8.4 10.4 8.2 15.4 12 18.8C15.8 15.4 15.6 10.4 12 7.8Z" />
    <path d="M12 18.8L9.4 21.6M12 18.8L14.6 21.6" />
    <path d="M12 11H12.1" strokeWidth={2.4} />
  </Svg>
)

/** Advisories: the budyong, the conch shell fishers blow to call or warn the shore */
export const BudyongIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.8 17.4C2.8 12.4 6.6 8.6 11.4 8.6C15 8.6 17.4 10.6 17.4 13.4C17.4 15.8 15.6 17.2 13.6 17.2C11.8 17.2 10.6 16.2 10.6 14.8C10.6 13.8 11.4 13.2 12.2 13.4" />
    <path d="M2.8 17.4L5.4 19.6H12.4" />
    <path d="M19.8 9.8Q21.2 12.6 19.8 15.4" />
    <path d="M21.8 7.8Q23.6 12.6 21.8 17.4" />
  </Svg>
)

/** Shelf life: an hourglass with the tide in it */
export const HourglassTideIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3.5H17M7 20.5H17" />
    <path d="M8 3.5C8 8 11 10 12 12C13 10 16 8 16 3.5" />
    <path d="M8 20.5C8 16 11 14 12 12C13 14 16 16 16 20.5" />
    <path d="M9.4 18.2Q10.7 17.2 12 18.2T14.6 18.2" />
  </Svg>
)

/** Sign out: lower the flag */
export const LowerFlagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.4 3.4V20.6" />
    <path d="M6.4 11.4C9.2 10 11.8 12.8 15.2 11.4V17.2C11.8 18.6 9.2 15.8 6.4 17.2" />
    <path d="M19 6.6V12.4" />
    <path d="M16.8 10.4L19 12.6L21.2 10.4" />
  </Svg>
)

/** Night mode: a crescent over the water */
export const MoonTideIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 3.6a5.2 5.2 0 0 0 7.8 7.8 7.8 7.8 0 1 1-7.8-7.8Z" />
    <path d="M19.4 4.6H19.5" strokeWidth={2.4} />
    <path d={wave(21.6)} />
  </Svg>
)

/** Total weight: the timbangan, the hanging scale of the fish market */
export const ScaleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3V19.4" />
    <path d="M4.4 7.2H19.6" />
    <path d="M4.4 7.2L2.6 13M4.4 7.2L6.2 13M19.6 7.2L17.8 13M19.6 7.2L21.4 13" />
    <path d="M2.2 13Q4.4 17 6.6 13Z" />
    <path d="M17.4 13Q19.6 17 21.8 13Z" />
    <path d="M8.4 20.4H15.6" />
  </Svg>
)

/** Value recovered: a peso coin afloat on the water */
export const CoinWaveIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="10" r="6.4" />
    <path d="M10.2 13.4V6.8H12.6A1.9 1.9 0 0 1 12.6 10.6H10.2" />
    <path d={wave(21)} />
  </Svg>
)

/** Processed: fish on a drying rack */
export const DryRackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5.6H21" />
    <path d="M5 5.6V20.4M19 5.6V20.4" />
    <path d="M9.6 5.6V8.6M14.4 5.6V8.6" />
    <path d="M9.6 8.6C7.8 10.6 8 13.8 9.6 16C11.2 13.8 11.4 10.6 9.6 8.6Z" />
    <path d="M14.4 8.6C12.6 10.6 12.8 13.8 14.4 16C16 13.8 16.2 10.6 14.4 8.6Z" />
  </Svg>
)