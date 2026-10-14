import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { RISK, type RiskLevel } from '../../lib/risk'

const ICON = { low: CheckCircle2, moderate: AlertCircle, high: AlertTriangle, critical: XCircle }

// Always icon + word + color, never color alone.
export default function RiskBadge({ level }: { level: RiskLevel }) {
  const r = RISK[level]
  const Icon = ICON[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${r.text} ${r.bg} ${r.line}`}>
      <Icon size={14} strokeWidth={1.8} strokeLinecap="round" aria-hidden />
      {r.label}
    </span>
  )
}
