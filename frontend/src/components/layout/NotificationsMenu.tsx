import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Fish, Wind, XCircle } from 'lucide-react'
import { byUrgency, isActive } from '../../data/mock'
import { useCatches } from '../../data/store'
import { useUser } from '../../lib/auth'
import { useT } from '../../lib/i18n'
import { useMarket } from '../../lib/market'
import { useSettings } from '../../lib/settings'
import { sellByText } from '../../lib/time'
import { hour12, useForecast, windWindow } from '../../lib/weather'

type Note = { id: string; tone: 'critical' | 'high' | 'wind' | 'need' | 'good'; title: string; body: string; to: string }

const TONE = {
  critical: { icon: XCircle, cls: 'bg-risk-critical-bg text-risk-critical' },
  high: { icon: AlertTriangle, cls: 'bg-risk-high-bg text-risk-high' },
  wind: { icon: Wind, cls: 'bg-risk-moderate-bg text-risk-moderate' },
  need: { icon: Fish, cls: 'bg-seafoam text-teal' },
  good: { icon: CheckCircle2, cls: 'bg-risk-low-bg text-risk-low' },
}

const readKey = (userId: string) => `lambat.notif.read.${userId}`
const loadRead = (userId: string): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(readKey(userId)) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const saveRead = (userId: string, ids: string[]) => {
  try { localStorage.setItem(readKey(userId), JSON.stringify(ids.slice(-200))) } catch { /* storage can be blocked */ }
}

/* The bell in the top bar. It opens a small panel of alerts built from your catches, the weather and what buyers need.
   It is not a page: tap an alert to go to what it is about. */
export default function NotificationsMenu() {
  const t = useT()
  const { lang } = useSettings()
  const user = useUser()
  const { catches } = useCatches()
  const { needs, offers } = useMarket()
  const forecast = useForecast(user.fisher?.landing)
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<string[]>(() => loadRead(user.id))
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const notes = useMemo<Note[]>(() => {
    const list: Note[] = []

    // Buyers who need a fish you have. Gone once you have offered, or the need is closed.
    const mySpecies = new Set(catches.filter(isActive).map((c) => c.species))
    needs
      .filter((n) => n.open && mySpecies.has(n.species))
      .filter((n) => !offers.some((o) => o.needId === n.id && o.fisherId === user.id && o.status !== 'declined'))
      .forEach((n) => {
        list.push({
          id: `need:${n.id}`,
          tone: 'need',
          title: `${n.species} · ${n.kg} kg wanted`,
          body: `${n.buyer ?? 'A buyer'} needs ${n.kg} kg${n.maxPrice ? `, up to ₱${n.maxPrice}/kg` : ''}. Tap to make an offer.`,
          to: '/needs',
        })
      })

    // The buyer answered your offer
    offers
      .filter((o) => o.fisherId === user.id && o.status !== 'pending')
      .forEach((o) => {
        list.push({
          id: `offer:${o.id}:${o.status}`,
          tone: o.status === 'accepted' ? 'good' : 'critical',
          title: o.status === 'accepted' ? 'Offer accepted' : 'Offer declined',
          body: `${o.species} · ${o.kg} kg at ₱${o.price}/kg`,
          to: '/needs',
        })
      })

    // Catches that are running out of time. The id includes the risk, so a catch that gets worse shows up as new again.
    catches
      .filter(isActive)
      .sort(byUrgency)
      .filter((c) => c.risk === 'high' || c.risk === 'critical')
      .forEach((c) => {
        list.push({
          id: `catch:${c.id}:${c.risk}`,
          tone: c.risk === 'critical' ? 'critical' : 'high',
          title: `${c.species} · ${c.kg} kg`,
          body: t('notif.catch.body', { risk: t(`risk.${c.risk}`), sellby: sellByText(c.hoursMin, lang, t) }),
          to: `/catches/${c.id}`,
        })
      })

    // Strong wind later today
    const strong = windWindow(forecast.hours)
    if (strong) {
      list.push({
        id: `wind:${forecast.week[0]?.date.toDateString() ?? 'today'}`,
        tone: 'wind',
        title: t('notif.wind.title'),
        body: t('wx.window', { from: hour12(strong.from), to: hour12(strong.to) }),
        to: '/weather',
      })
    }
    return list
  }, [catches, needs, offers, user.id, forecast.hours, forecast.week, lang, t])

  const unread = notes.filter((n) => !read.includes(n.id)).length

  const markRead = (ids: string[]) => {
    const next = [...new Set([...read, ...ids])]
    setRead(next)
    saveRead(user.id, next)
  }

  return (
    <div ref={box} className="sm:relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `${t('nav.alerts')}: ${t('notif.new', { n: unread })}` : t('nav.alerts')}
        onClick={() => setOpen(!open)}
        className="relative grid size-11 place-items-center rounded-full transition hover:bg-seafoam"
      >
        <Bell size={22} strokeWidth={1.8} aria-hidden className={unread ? 'anim-ring' : ''} />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold leading-5 text-deep ring-2 ring-card">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label={t('nav.alerts')} className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-card shadow-raised sm:inset-x-auto sm:right-0 sm:w-96">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="font-numeral text-lg font-bold">{t('nav.alerts')}</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead(notes.map((n) => n.id))}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-teal transition hover:bg-seafoam"
              >
                <CheckCheck size={16} strokeWidth={1.8} aria-hidden />
                {t('notif.markall')}
              </button>
            )}
          </div>

          {notes.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-seafoam text-teal">
                <Bell size={22} strokeWidth={1.8} aria-hidden />
              </span>
              <p className="mt-3 font-semibold">{t('notif.empty')}</p>
              <p className="mt-1 text-sm text-ink-soft">{t('notif.empty.sub')}</p>
            </div>
          ) : (
            <ul className="max-h-[60dvh] divide-y divide-line overflow-y-auto">
              {notes.map((n) => {
                const isNew = !read.includes(n.id)
                const tone = TONE[n.tone]
                return (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      onClick={() => { markRead([n.id]); setOpen(false) }}
                      className={`flex items-start gap-3 px-4 py-3 transition hover:bg-seafoam/60 ${isNew ? '' : 'opacity-60'}`}
                    >
                      <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${tone.cls}`}>
                        <tone.icon size={20} strokeWidth={1.8} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-tight">{n.title}</span>
                        <span className="mt-0.5 block text-sm text-ink-soft">{n.body}</span>
                      </span>
                      {isNew && <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-coral" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}