import type { ReactNode } from 'react'
import { useT } from '../../lib/i18n'

// Show wherever a risk estimate or price appears.
export default function Disclaimer({ children }: { children?: ReactNode }) {
  const t = useT()
  return <p className="text-sm italic text-ink-soft">{children ?? t('disc.guide')}</p>
}