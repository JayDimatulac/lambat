import { Link } from 'react-router-dom'
import { PlusCircle, Wind } from 'lucide-react'
import CatchCard from '../components/CatchCard'
import Disclaimer from '../components/ui/Disclaimer'
import { catches } from '../data/mock'

function greeting(hour: number) {
  if (hour < 12) return 'Magandang umaga'
  if (hour < 13) return 'Magandang tanghali'
  if (hour < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

export default function Dashboard() {
  const now = new Date()
  const active = catches.filter((c) => !c.sold).sort((a, b) => a.hoursMin - b.hoursMin)
  const urgentCount = active.filter((c) => c.risk === 'high' || c.risk === 'critical').length
  const summary =
    urgentCount > 0
      ? `${urgentCount} huli ang kailangang maibenta agad`
      : `${active.length} huli ang binabantayan ngayon`

  return (
    <div className="space-y-6">
      <section className="rounded-md bg-dawn p-6 pb-14 text-white">
        <p className="text-base text-white">
          {now.toLocaleDateString('fil-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="mt-1 text-[28px] font-semibold leading-tight">
          {greeting(now.getHours())}, Mang Ramon
        </h2>
        <p className="mt-1 text-base font-medium text-white">{summary}</p>
      </section>

      <Link
        to="/weather"
        className="flex items-center gap-3 rounded-md border border-teal/30 bg-ice p-4 transition hover:shadow-rest"
      >
        <Wind className="shrink-0 text-teal" size={24} strokeWidth={1.8} aria-hidden />
        <div className="flex-1">
          <p className="font-semibold text-navy">Malakas na hangin sa inyong lugar</p>
          <p className="text-base text-ink-soft">Hanggang 6:00 PM</p>
        </div>
        <span className="text-base font-semibold text-teal">Tingnan</span>
      </Link>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl">Mga Aktibong Huli</h2>
          <Link to="/catches" className="text-base font-semibold text-teal">
            Lahat ({active.length})
          </Link>
        </div>
        <p className="mb-3 text-base text-ink-soft">Pinakamadalian ang nasa unahan. Ang tag ay panganib ng pagkasira.</p>

        {active.length === 0 ? (
          <div className="rounded-md border border-dashed border-line bg-white p-8 text-center">
            <p className="font-semibold">Wala pang aktibong huli</p>
            <p className="mt-1 text-base text-ink-soft">Itala ang huli mo para masimulan ang pagbantay.</p>
            <Link
              to="/catches/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-coral px-5 py-3 text-base font-semibold text-navy hover:brightness-95"
            >
              <PlusCircle size={20} strokeWidth={1.8} aria-hidden /> Itala ang Huli
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.slice(0, 3).map((c) => <CatchCard key={c.id} c={c} />)}
          </div>
        )}

        <div className="mt-4">
          <Disclaimer>Tantiya lamang ito. Hindi ito food-safety test.</Disclaimer>
        </div>
      </section>
    </div>
  )
}