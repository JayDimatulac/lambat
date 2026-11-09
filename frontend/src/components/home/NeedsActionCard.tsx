import { useSettings } from '../../lib/settings'

const WAVE = 'M0 198 q15 -8 30 0' + ' t30 0'.repeat(19)

function Cloud({ x, y, s = 1, o = 1, delay = 0 }: { x: number; y: number; s?: number; o?: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <g className="anim-drift" style={{ animationDelay: `${delay}s` }} fill="#ffffff">
        <ellipse cx="0" cy="0" rx="28" ry="10" />
        <circle cx="-11" cy="-8" r="10" />
        <circle cx="8" cy="-13" r="14" />
        <circle cx="21" cy="-4" r="8" />
      </g>
    </g>
  )
}

export default function NeedsActionCard({ title, message }: { title: string; message: string }) {
  const { theme } = useSettings()
  const night = theme === 'night'

  return (
    <section
      className={`flex h-full min-h-72 flex-col overflow-hidden rounded-[28px] border border-line shadow-raised ${
        night ? 'text-white' : 'text-deep'
      }`}
    >
      {/* Scene */}
      <div className="relative h-56 shrink-0">
        <svg
          viewBox="0 0 600 224"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#12394d" />
              <stop offset="1" stopColor="#1a566b" />
            </linearGradient>
            <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8fd3e3" />
              <stop offset="0.7" stopColor="#d5eef0" />
              <stop offset="1" stopColor="#fde3c8" />
            </linearGradient>
            <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fde3c8" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fde3c8" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="sun-glow">
              <stop offset="0" stopColor="#ffe9b8" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffe9b8" stopOpacity="0" />
            </radialGradient>
            <clipPath id="tower-clip">
              <polygon points="92,190 128,190 121,92 99,92" />
            </clipPath>
          </defs>

          {/* Sky */}
          <rect width="600" height="224" fill={night ? 'url(#sky-night)' : 'url(#sky-day)'} />

          {night ? (
            <>
              {/* Stars */}
              <g fill="#fff">
                <circle cx="330" cy="30" r="1.6" />
                <circle cx="440" cy="18" r="1.4" />
                <circle cx="520" cy="46" r="1.8" />
                <circle cx="570" cy="22" r="1.5" />
                <circle cx="390" cy="70" r="1.2" />
                <circle cx="500" cy="96" r="1.2" />
              </g>
              {/* Lighthouse beam */}
              <polygon points="116,74 600,-10 600,70" fill="url(#beam)" />
              <polygon points="104,78 0,56 0,92" fill="url(#beam)" opacity="0.6" />
            </>
          ) : (
            <>
              {/* Sun */}
              <circle cx="500" cy="62" r="64" fill="url(#sun-glow)" />
              <circle cx="500" cy="62" r="26" fill="#ffd98a" />
              {/* Clouds */}
              <Cloud x={300} y={50} s={1.1} o={0.95} />
              <Cloud x={430} y={120} s={0.8} o={0.8} delay={3} />
              <Cloud x={560} y={30} s={0.7} o={0.85} delay={6} />
              <Cloud x={200} y={110} s={0.6} o={0.7} delay={9} />
            </>
          )}

          {/* Rock island */}
          <path d="M30 204 Q110 168 200 204 Z" fill={night ? '#0c3a4d' : '#3a7f8a'} />

          {/* Lighthouse tower */}
          <g clipPath="url(#tower-clip)">
            <rect x="90" y="92" width="40" height="100" fill="#fbe7d3" />
            <rect x="90" y="112" width="40" height="16" fill="#e8745a" />
            <rect x="90" y="146" width="40" height="16" fill="#e8745a" />
          </g>
          <rect x="94" y="86" width="32" height="7" rx="2" fill={night ? '#0c3a4d' : '#235a66'} />
          <rect
            x="102" y="70" width="16" height="16" rx="2"
            fill={night ? '#ffd9a0' : '#cfe9ee'}
          />
          <polygon points="99,70 110,57 121,70" fill="#e8745a" />
          <rect x="106" y="170" width="8" height="14" rx="3" fill={night ? '#0c3a4d' : '#235a66'} />

          {/* Waves */}
          <path
            d={WAVE}
            fill="none"
            stroke={night ? '#ffffff' : '#ffffff'}
            strokeOpacity={night ? 0.35 : 0.7}
            strokeWidth="2"
          />
        </svg>

        {/* Text sits to the right of the lighthouse */}
        <div className="relative flex h-full flex-col justify-center pl-[38%] pr-6">
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className={`mt-1 text-base ${night ? 'text-white/90' : 'text-deep/80'}`}>{message}</p>
        </div>
      </div>

      {/* Sea below the scene */}
      <div
        className={`flex-1 ${
          night
            ? 'bg-gradient-to-b from-[#10485c] to-[#0e3f52]'
            : 'bg-gradient-to-b from-[#3b9aa5] to-[#2a7f8e]'
        }`}
      />
    </section>
  )
}