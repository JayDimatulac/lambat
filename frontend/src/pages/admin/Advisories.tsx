import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, CardHead } from './ui'
import { SENT, type Ctx } from './data'

const field = 'w-full rounded-[14px] border-[1.5px] border-line bg-mint px-3.5 py-2.5 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10'
const lbl = 'mb-1.5 mt-3 block text-sm font-semibold'
export default function Advisories() {
  const { toast } = useOutletContext<Ctx>()
  const [type, setType] = useState('Weather / sea condition')
  const [place, setPlace] = useState('Batangas Bay')
  const [text, setText] = useState('')
  const [err, setErr] = useState(false)
  const [log, setLog] = useState(SENT)
  const send = () => {
    if (!text.trim()) { setErr(true); toast('Isulat muna ang mensahe'); return }
    setErr(false)
    setLog(l => [[text.length > 48 ? text.slice(0, 48) + '…' : text, `${type} · ${place}`, 'Nakapila sa SMS', 'Ngayon lang'], ...l])
    setText(''); toast('Naipost ang advisory')
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHead title="Bagong advisory" sub="Sent as an in-app alert and by SMS to fisherfolk in the area." />
        <label className={lbl} htmlFor="a1">Uri</label>
        <select id="a1" className={field} value={type} onChange={e => setType(e.target.value)}>
          <option>Weather / sea condition</option><option>Spoilage alert</option><option>Market update</option>
        </select>
        <label className={lbl} htmlFor="a2">Lugar</label>
        <select id="a2" className={field} value={place} onChange={e => setPlace(e.target.value)}>
          <option>Batangas Bay</option><option>Calatagan coast</option><option>Taal Lake</option><option>Buong Batangas</option>
        </select>
        <label className={lbl} htmlFor="a3">Mensahe</label>
        <textarea id="a3" maxLength={160} value={text} onChange={e => setText(e.target.value)} placeholder="Hal. Malakas ang hangin hanggang 6:00 PM. Para sa pagpaplano lamang."
          className={`${field} min-h-[84px] resize-y ${err ? 'border-risk-critical-line' : ''}`} />
        <p className="mt-1 text-xs italic text-ink-soft">{text.length} / 160 characters (1 SMS)</p>
        <div className="mt-3 flex gap-2">
          <button onClick={send} className="rounded-full bg-cream px-5 py-2 text-sm font-semibold text-deep hover:brightness-95">I-post ang advisory</button>
          <button onClick={() => setText('')} className="rounded-full border-[1.5px] border-teal px-5 py-2 text-sm font-semibold text-teal hover:bg-seafoam/40">I-clear</button>
        </div>
      </Card>
      <Card>
        <CardHead title="Mga naipadala" sub="Delivery by SMS and app" />
        <div className="flex flex-col gap-2.5">
          {log.map((l, i) => <div key={i} className="rounded-2xl border border-line px-3.5 py-3 text-sm"><b>{l[0]}</b><small className="block text-xs text-ink-soft">{l[1]} · {l[2]}</small><small className="block text-xs text-ink-soft">{l[3]}</small></div>)}
        </div>
      </Card>
    </div>
  )
}