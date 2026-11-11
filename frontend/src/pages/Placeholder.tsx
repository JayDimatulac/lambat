import Disclaimer from '../components/ui/Disclaimer'
import { useT } from '../lib/i18n'

export default function Placeholder({ title }: { title: string }) {
  const t = useT()
  return (
    <div className="space-y-2">
      <h2 className="text-[26px]">{title}</h2>
      <p className="text-ink-soft">{t('ph.next')}</p>
      <Disclaimer />
    </div>
  )
}