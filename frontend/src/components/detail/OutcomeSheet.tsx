import Sheet from '../ui/Sheet'
import Button from '../ui/Button'
import type { Catch, Outcome } from '../../data/mock'
import { useT, type Key } from '../../lib/i18n'

const QUESTION: Record<Outcome, Key> = { sold: 'outcome.sold.q', shared: 'outcome.shared.q', lost: 'outcome.lost.q' }

/* One question, one tap. Mistakes are fixed with Undo on the catch afterwards. */
export default function OutcomeSheet({ c, kind, onClose, onConfirm }: { c: Catch; kind: Outcome | null; onClose: () => void; onConfirm: (o: Outcome) => void }) {
  const t = useT()
  return (
    <Sheet open={kind !== null} onClose={onClose} title={kind ? t(QUESTION[kind]) : ''}>
      {kind && (
        <>
          <p className="text-lg">{t('outcome.body', { kg: c.kg, species: c.species, what: t(`tally.${kind}`).toLowerCase() })}</p>
          <div className="space-y-3">
            <Button className="min-h-14 w-full text-base" onClick={() => onConfirm(kind)}>{t('outcome.yes')}</Button>
            <Button variant="secondary" className="min-h-14 w-full" onClick={onClose}>{t('outcome.notyet')}</Button>
          </div>
        </>
      )}
    </Sheet>
  )
}