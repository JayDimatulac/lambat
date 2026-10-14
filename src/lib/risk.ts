export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export const RISK: Record<RiskLevel, { label: string; text: string; bg: string; line: string }> = {
  low:      { label: 'Low',      text: 'text-risk-low',      bg: 'bg-risk-low-bg',      line: 'border-risk-low-line' },
  moderate: { label: 'Moderate', text: 'text-risk-moderate', bg: 'bg-risk-moderate-bg', line: 'border-risk-moderate-line' },
  high:     { label: 'High',     text: 'text-risk-high',     bg: 'bg-risk-high-bg',     line: 'border-risk-high-line' },
  critical: { label: 'Critical', text: 'text-risk-critical', bg: 'bg-risk-critical-bg', line: 'border-risk-critical-line' },
}
