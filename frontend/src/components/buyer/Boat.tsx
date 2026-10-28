// One bangka, drawn around (0,0) so a scene can place and scale it. The lantern shows how urgent the lot is.
export const BOAT = {
  hull: 'M-40 0H40Q30 20 0 20T-40 0Z',
  mast: 'M0 0V-38',
  sail: 'M0 -38L30 -4H0Z',
  arms: 'M-30 4L-58 18M30 4L58 18',
  floats: 'M-68 18H-50M50 18H68',
}

export default function Boat({ lamp, flag }: { lamp?: string; flag?: string }) {
  return (
    <g stroke="var(--color-deep)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <path d={BOAT.arms} fill="none" />
      <path d={BOAT.floats} fill="none" />
      <path d={BOAT.hull} style={{ fill: 'var(--color-cream)' }} />
      <path d={BOAT.sail} style={{ fill: 'var(--color-coral)' }} />
      <path d={BOAT.mast} fill="none" />
      {flag && <path d="M0 -38L16 -33L0 -28Z" style={{ fill: flag }} />}
      {lamp && <circle cx="0" cy="-44" r="6" style={{ fill: lamp }} className="anim-glow" />}
    </g>
  )
}