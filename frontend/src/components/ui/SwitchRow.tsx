import type { ReactNode } from 'react'

// A row with an on/off switch: icon, title, a short hint, and the switch on the right.
export default function SwitchRow({ icon, label, hint, checked, onChange }: { icon: ReactNode; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 rounded-md border border-line bg-mint px-4 py-3 text-left"
    >
      <span className="text-teal">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
      <span aria-hidden="true" className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-teal' : 'bg-line'}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-card shadow-rest transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  )
}