import { useSettings, type Lang } from '../../lib/settings'
import { useT } from '../../lib/i18n'
import Segmented from '../ui/Segmented'

export default function LangToggle() {
  const t = useT()
  const { lang, setLang } = useSettings()
  return (
    <Segmented<Lang>
      label={t('menu.language')}
      value={lang ?? 'en'}
      onChange={setLang}
      options={[
        { value: 'en', label: 'EN', aria: 'English' },
        { value: 'fil', label: 'FIL', aria: 'Filipino' },
      ]}
    />
  )
}