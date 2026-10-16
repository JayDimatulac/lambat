import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useT } from '../../lib/i18n'

// A bottom sheet on phones, a side panel on desktop. Esc or a tap outside closes it.
export default function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const t = useT()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-deep/50" aria-label={t('menu.close')} onClick={onClose} />
      <div className="anim-rise absolute inset-x-0 bottom-0 max-h-[90dvh] space-y-5 overflow-y-auto rounded-t-lg bg-card p-5 shadow-raised lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[400px] lg:rounded-none">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('menu.close')} className="grid size-12 shrink-0 place-items-center rounded-full hover:bg-seafoam">
            <X size={24} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}