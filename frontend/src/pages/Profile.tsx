import type { ReactNode } from 'react'
import { Anchor, Compass, Mail, MapPin, Phone, Ship, Waves } from 'lucide-react'
import Disclaimer from '../components/ui/Disclaimer'
import { useCatches } from '../data/store'
import { useUser } from '../lib/auth'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'
import { localeOf } from '../lib/time'

const card = 'rounded-lg border border-line bg-card p-5 shadow-rest'

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-teal">{icon}</span>
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="ml-auto text-right font-semibold">{value}</dd>
    </div>
  )
}

export default function Profile() {
  const t = useT()
  const { lang } = useSettings()
  const user = useUser()
  const { catches } = useCatches()
  const f = user.fisher
  const unset = t('profile.unset')

  const count = (o: 'sold' | 'shared' | 'lost') => catches.filter((c) => c.outcome === o).length
  const tiles = [
    { label: t('profile.logged'), n: catches.length },
    { label: t('tally.sold'), n: count('sold') },
    { label: t('tally.shared'), n: count('shared') },
    { label: t('tally.lost'), n: count('lost') },
  ]

  const since = new Date(user.createdAt).toLocaleDateString(localeOf(lang), { year: 'numeric', month: 'long' })
  const login = user.mobile || user.username || ''

  return (
    <div className="space-y-5">
      <h1 className="sr-only">{t('nav.profile')}</h1>

      {/* Who you are */}
      <section
        className="relative overflow-hidden rounded-lg p-5 text-white shadow-raised sm:p-6"
        style={{ background: 'linear-gradient(135deg, var(--tide-sky-0) 0%, #0f4a5c 55%, var(--tide-sea-1) 100%)' }}
      >
        <svg viewBox="0 0 360 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full" aria-hidden="true">
          <path d="M0 22q15-8 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0V40H0Z" fill="#fff" fillOpacity="0.08" />
        </svg>
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-full bg-teal font-numeral text-3xl font-bold text-on-accent ring-4 ring-coral/80 ring-offset-2 ring-offset-deep">
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-numeral text-[28px] font-bold leading-tight text-white">{user.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin size={16} strokeWidth={1.8} aria-hidden />
              {f?.landing || user.barangay}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{t('reg.fisher')}</span>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-deep">{t(`status.${user.status}`)}</span>
            </div>
          </div>
        </div>
        <p className="relative mt-4 text-sm text-white/80">{t('profile.since', { date: since })}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* How to reach you */}
        <section className={card} aria-label={t('profile.contact')}>
          <h3 className="text-xl">{t('profile.contact')}</h3>
          <dl className="mt-2 divide-y divide-line">
            {login && <Row icon={<Phone size={20} strokeWidth={1.8} aria-hidden />} label={t('reg.mobile')} value={login} />}
            {user.email && <Row icon={<Mail size={20} strokeWidth={1.8} aria-hidden />} label={t('reg.email')} value={user.email} />}
            <Row icon={<MapPin size={20} strokeWidth={1.8} aria-hidden />} label={t('reg.barangay')} value={user.barangay || unset} />
          </dl>
        </section>

        {/* How you fish */}
        <section className={card} aria-label={t('profile.fishing')}>
          <h3 className="text-xl">{t('profile.fishing')}</h3>
          <dl className="mt-2 divide-y divide-line">
            <Row icon={<Anchor size={20} strokeWidth={1.8} aria-hidden />} label={t('profile.landing')} value={f?.landing || unset} />
            <Row icon={<Ship size={20} strokeWidth={1.8} aria-hidden />} label={t('profile.boat')} value={f?.boat ? t(`boat.${f.boat}`) : unset} />
            <Row icon={<Waves size={20} strokeWidth={1.8} aria-hidden />} label={t('profile.gear')} value={f?.gear?.length ? f.gear.map((g) => t(`gear.${g}`)).join(', ') : unset} />
            <Row icon={<Compass size={20} strokeWidth={1.8} aria-hidden />} label={t('profile.ground')} value={f?.ground ? t(`ground.${f.ground}`) : unset} />
          </dl>
        </section>
      </div>

      {/* What you have done */}
      <section className={card} aria-label={t('profile.catches')}>
        <h3 className="text-xl">{t('profile.catches')}</h3>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((x) => (
            <li key={x.label} className="rounded-md border border-line bg-mint px-4 py-3">
              <p className="font-numeral text-4xl font-bold leading-none text-teal">{x.n}</p>
              <p className="mt-1 text-sm font-semibold text-ink-soft">{x.label}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-ink-soft">{t('profile.edit.soon')}</p>
      <Disclaimer />
    </div>
  )
}