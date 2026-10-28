import Boat from './Boat'

const WAVES = 'M0 92q15-6 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0'

/* A boat at anchor: it is here, but not allowed to land yet. The flag shows where the application stands. */
export default function AnchorScene({ tone }: { tone: 'wait' | 'no' }) {
  const flag = tone === 'no' ? 'var(--color-risk-critical-line)' : 'var(--color-risk-moderate-line)'
  return (
    <div className="overflow-hidden rounded-lg" style={{ background: 'linear-gradient(180deg, var(--tide-sky-0), var(--tide-sea-0))' }}>
      <svg viewBox="0 0 320 150" className="block w-full" aria-hidden="true">
        {[[30, 16], [80, 30], [250, 14], [290, 34], [200, 22]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" className="anim-twinkle" style={{ animationDelay: `${i * 0.6}s` }} />
        ))}
        <rect x="0" y="136" width="320" height="14" style={{ fill: 'var(--tide-seabed)' }} />
        <path d="M160 96V126" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="3 4" />
        <g stroke="var(--color-cream)" strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M160 126V138M151 132Q160 143 169 132M155 129H165" />
        </g>
        <g transform="translate(160 78)">
          <g className="anim-rock" style={{ transformOrigin: '0px 10px', ['--rock' as string]: '2.5deg' }}>
            <Boat flag={flag} />
          </g>
        </g>
        <g className="anim-drift"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="2" /></g>
        <g className="anim-drift-rev" transform="translate(0 7)"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" /></g>
      </svg>
    </div>
  )
}