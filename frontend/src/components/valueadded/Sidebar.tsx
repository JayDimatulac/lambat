import type { Catch } from '../../data/mock'
import { useT } from '../../lib/i18n'
import { agoText } from '../../lib/time'
import RiskBadge from '../ui/RiskBadge'

const tipKeys = ['va.tip1', 'va.tip2', 'va.tip3', 'va.tip4'] as const
const card = 'space-y-2 rounded-lg border border-line bg-card p-4 shadow-rest'

export default function Sidebar({ c }: { c: Catch }) {
  const t = useT()

  return (
    <aside className="space-y-4">
      <section className={card}>
        <h2 className="font-sans text-lg font-bold">{t('va.sum.title')}</h2>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
          <dt>{t('va.sel.species')}</dt><dd className="font-semibold">{c.species}</dd>
          <dt>{t('va.sel.qty')}</dt><dd>{c.kg} kg</dd>
          <dt>{t('va.sel.cond')}</dt><dd><RiskBadge level={c.risk} /></dd>
        </dl>
        <p className="text-sm text-ink-soft">{c.place} · {agoText(c.hoursAgo, t)}</p>
      </section>
      <section className={card}>
        <h2 className="font-sans text-lg font-bold">{t('va.note.title')}</h2>
        <p className="text-sm text-ink-soft">{t('va.note.body')}</p>
      </section>
      <section className={card}>
        <h2 className="font-sans text-lg font-bold">{t('va.tips.title')}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {tipKeys.map((key) => <li key={key}>{t(key)}</li>)}
        </ul>
      </section>
      <section className={card}>
        <h2 className="font-sans text-lg font-bold">{t('va.help.title')}</h2>
        <p className="text-sm text-ink-soft">{t('va.help.more')}</p>
      </section>
    </aside>
  )
}