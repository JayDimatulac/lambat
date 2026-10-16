import { Volume2 } from 'lucide-react'
import { useSettings } from '../../lib/settings'
import { useT } from '../../lib/i18n'

// Reads the result aloud with the phone's own voice. Which voices exist depends on the phone,
// so a Filipino voice is not guaranteed. Hidden when the browser cannot speak.
export default function SpeakButton({ text }: { text: string }) {
  const t = useT()
  const { lang } = useSettings()
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const speak = () => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'fil' ? 'fil-PH' : 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }
  return (
    <button type="button" onClick={speak} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/60 px-4 text-sm font-semibold text-white hover:bg-white/10">
      <Volume2 size={20} strokeWidth={1.8} aria-hidden />
      {t('detail.speak')}
    </button>
  )
}