import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, CardHead, Chip, Seg, Table } from './ui'
import type { Ctx, Status } from './data'

const LABEL: Record<Status, string> = { pend: 'Naghihintay', ok: 'Na-verify', no: 'Tinanggihan' }
export default function Verifications() {
  const { accounts, setStatus, toast } = useOutletContext<Ctx>()
  const [f, setF] = useState<Status | 'all'>('all')
  const act = (i: number, s: Status) => { setStatus(i, s); toast(`${accounts[i].name} ay ${s === 'ok' ? 'na-verify' : 'tinanggihan'}`) }
  return (
    <Card>
      <CardHead title="Mga naghihintay ng verification" sub="Review sign-ups before they can see listings or catch volume." />
      <Seg value={f} onChange={setF} options={[['all', 'Lahat'], ['pend', 'Naghihintay'], ['ok', 'Na-verify'], ['no', 'Tinanggihan']]} />
      <Table head={['Account', 'Uri', 'Lugar', 'Kailangan nila', 'Status', '']}>
        {accounts.map((a, i) => (f === 'all' || a.status === f) && (
          <tr key={a.name}>
            <td className="font-bold">{a.name}</td><td>{a.type}</td><td>{a.town}</td><td>{a.needs}</td>
            <td><Chip tone={a.status}>{LABEL[a.status]}</Chip></td>
            <td>{a.status === 'pend' && (
              <div className="flex gap-2">
                <button onClick={() => act(i, 'ok')} className="rounded-full bg-coral px-3.5 py-1.5 text-[13px] font-semibold text-deep hover:bg-coral-dark">I-verify</button>
                <button onClick={() => act(i, 'no')} className="rounded-full border-[1.5px] border-risk-critical-line px-3.5 py-1.5 text-[13px] font-semibold text-risk-critical">Tanggihan</button>
              </div>)}</td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}