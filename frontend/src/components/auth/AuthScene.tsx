// The picture on the way in: the parola's beam sweeps over the water to guide a bangka home.
const left = (y: number) => 47 + ((128 - y) / 70) * 6
const right = (y: number) => 81 - ((128 - y) / 70) * 6
const band = (y1: number, y2: number) => `${left(y1)},${y1} ${right(y1)},${y1} ${right(y2)},${y2} ${left(y2)},${y2}`
const WAVES = 'M-60 0q15-6 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0'
const STARS: [number, number, number][] = [[200, 22, 1.8], [250, 44, 1.3], [300, 18, 1.8], [340, 52, 1.3], [160, 60, 1.3], [320, 90, 1.3], [120, 20, 1.3]]

export default function AuthScene() {
  return (
    <svg viewBox="0 0 360 250" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <linearGradient id="auth-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05171e" />
          <stop offset=".55" stopColor="#0a3a4a" />
          <stop offset="1" stopColor="#2e8391" />
        </linearGradient>
        <linearGradient id="auth-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b6f7d" />
          <stop offset="1" stopColor="#05171e" />
        </linearGradient>
        <linearGradient id="auth-beam" gradientUnits="userSpaceOnUse" x1="84" y1="0" x2="380" y2="0">
          <stop offset="0" stopColor="#fbd9b8" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fbd9b8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="auth-glow">
          <stop offset="0" stopColor="#e8735a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e8735a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="250" fill="url(#auth-sky)" />
      {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" className="anim-twinkle" style={{ animationDelay: `${i * 0.5}s` }} />)}
      <circle cx="300" cy="150" r="26" fill="#fbd9b8" fillOpacity="0.18" />

      <rect y="172" width="360" height="78" fill="url(#auth-sea)" />

      <g className="anim-sweep" style={{ transformOrigin: '84px 120px' }}>
        <polygon points="84,120 380,150 380,206" fill="url(#auth-beam)" />
      </g>

      <g transform="translate(10 66) scale(1.15)">
        <circle cx="64" cy="47" r="30" fill="url(#auth-glow)" className="anim-glow" />
        <path d="M4 150C14 130 36 125 64 127C92 125 112 132 124 150Z" fill="#05171e" />
        <path d="M47 128L53 58H75L81 128Z" fill="#fbd9b8" />
        <polygon points={band(74, 88)} fill="#e8735a" />
        <polygon points={band(102, 116)} fill="#e8735a" />
        <path d="M47 128L53 58H75L81 128Z" fill="none" stroke="#0a2f3c" strokeWidth="2" strokeLinejoin="round" />
        <rect x="49" y="54" width="30" height="5" rx="2" fill="#0a2f3c" />
        <rect x="55" y="38" width="18" height="16" rx="2" fill="#e8735a" stroke="#0a2f3c" strokeWidth="2" />
        <path d="M64 38V54" stroke="#0a2f3c" strokeWidth="1.5" />
        <path d="M51 38L64 26L77 38Z" fill="#e8735a" stroke="#0a2f3c" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="64" cy="24" r="2.4" fill="#0a2f3c" />
        <rect x="60" y="116" width="8" height="12" rx="4" fill="#0a2f3c" />
      </g>

      <g className="anim-rock" style={{ transformOrigin: '268px 186px', ['--rock' as string]: '3deg' }}>
        <path d="M236 180C246 192 290 192 300 180Z" fill="#e8735a" stroke="#fbd9b8" strokeWidth="2" strokeLinejoin="round" />
        <path d="M268 180V148" stroke="#fbd9b8" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M268 148L292 176H268Z" fill="#fbd9b8" stroke="#fbd9b8" strokeWidth="2" strokeLinejoin="round" />
        <path d="M246 184L230 196M290 184L306 196" stroke="#fbd9b8" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M222 198H240M296 198H314" stroke="#fbd9b8" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="268" cy="146" r="3" fill="#fbd9b8" className="anim-glow" />
      </g>

      <g transform="translate(0 176)"><g className="anim-drift"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2.2" /></g></g>
      <g transform="translate(0 200)"><g className="anim-drift-rev"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" /></g></g>
      <g transform="translate(0 226)"><g className="anim-drift"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" /></g></g>
    </svg>
  )
}