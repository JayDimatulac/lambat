export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

// Tailwind classes for text/chips, and a raw CSS color (fill) for graphics such as buoys.
export const RISK: Record<RiskLevel, { text: string; bg: string; line: string; fill: string }> = {
  low:      { text: 'text-risk-low',      bg: 'bg-risk-low-bg',      line: 'border-risk-low-line',      fill: 'var(--color-risk-low-line)' },
  moderate: { text: 'text-risk-moderate', bg: 'bg-risk-moderate-bg', line: 'border-risk-moderate-line', fill: 'var(--color-risk-moderate-line)' },
  high:     { text: 'text-risk-high',     bg: 'bg-risk-high-bg',     line: 'border-risk-high-line',     fill: 'var(--color-risk-high-line)' },
  critical: { text: 'text-risk-critical', bg: 'bg-risk-critical-bg', line: 'border-risk-critical-line', fill: 'var(--color-risk-critical-line)' },
}