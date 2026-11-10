import { useState } from 'react'
import { ApiError, api } from '../../lib/api'
import { fishName, type ApiOrder } from '../../lib/marketApi'

/* Orders a buyer has confirmed. Only the fisherfolk can finish one: mark it done when the fish has been handed over,
   or cancel it so the catch can go back to the radar. */
export default function OrdersToFinish({ orders, onChanged }: { orders: ApiOrder[]; onChanged: () => void }) {
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const open = orders.filter((o) => o.status === 'CONFIRMED')
  if (open.length === 0) return null

  const run = async (id: string, action: 'complete' | 'cancel') => {
    if (action === 'cancel' && !window.confirm('Cancel this order? The catch goes back to the radar.')) return
    setBusy(id)
    setErr('')
    try {
      await api.patch(`/orders/${id}/${action}`)
      onChanged()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not update the order')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="space-y-3 rounded-lg border-2 border-coral bg-card p-4 shadow-raised">
      <h2 className="font-numeral text-xl font-bold leading-tight">Orders to finish</h2>
      {open.map((o) => (
        <div key={o.id} className="space-y-3 rounded-md bg-seafoam p-3">
          <p className="text-sm font-semibold">
            {o.buyer.businessName || o.buyer.name} bought {o.kilos} kg {fishName(o.catch.species)} at ₱{o.pricePerKg}/kg
            <span className="block font-normal text-ink-soft">Total ₱{(o.kilos * o.pricePerKg).toLocaleString('en-US')} · {o.buyer.barangay}</span>
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={busy === o.id} onClick={() => run(o.id, 'complete')} className="min-h-11 rounded-full bg-coral px-4 text-sm font-semibold text-deep disabled:opacity-60">Mark as done</button>
            <button type="button" disabled={busy === o.id} onClick={() => run(o.id, 'cancel')} className="min-h-11 rounded-full border-2 border-line px-4 text-sm font-semibold disabled:opacity-60">Cancel order</button>
          </div>
        </div>
      ))}
      {err && <p role="alert" className="text-sm font-semibold text-risk-critical">{err}</p>}
    </section>
  )
}