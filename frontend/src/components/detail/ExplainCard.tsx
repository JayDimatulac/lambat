import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import SpeakButton from './SpeakButton'
import { api, ApiError } from '../../lib/api'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

type Answer = { text: string; source: 'ai' | 'template' }

// Asks the server to explain the estimate in plain words. The server only uses numbers it calculated itself,
// and falls back to a fixed sentence if the AI is busy, so this never comes back empty.
export default function ExplainCard({ id }: { id: string }) {
  const t = useT()
  const { lang } = useSettings()
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ask = async () => {
    setBusy(true)
    setError(null)
    try {
      setAnswer(await api.post<Answer>(`/catches/${id}/explain`, { lang: lang === 'en' ? 'en' : 'fil' }))
    } catch (e) {
      const status = e instanceof ApiError ? e.status : -1
      setError(status === 0 ? t('auth.err.network') : status === 429 ? t('auth.err.busy') : t('explain.err'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-line bg-card p-5 shadow-rest">
      {!answer && (
        <button
          type="button"
          onClick={ask}
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-5 text-base font-semibold text-teal disabled:opacity-60"
        >
          {busy ? <Loader2 size={20} strokeWidth={2} className="animate-spin" aria-hidden /> : <Sparkles size={20} strokeWidth={1.8} aria-hidden />}
          {busy ? t('explain.loading') : t('explain.btn')}
        </button>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-risk-critical">{error}</p>}
      {answer && (
        <div className="space-y-3">
          <p className="text-lg leading-snug">{answer.text}</p>
          <p className="text-sm text-ink-soft">{answer.source === 'ai' ? t('explain.ai') : t('explain.plain')}</p>
          <SpeakButton text={answer.text} />
        </div>
      )}
    </section>
  )
}