import { useState } from 'react'
import { Card, CardHead, Badge, Chip, Seg, Table } from './ui'
import { LISTINGS } from './data'

const TYPES = ['Find buyer', 'Quick sale', 'Redistribute']
export default function Listings() {
  const [f, setF] = useState('all')
  return (
    <Card>
      <CardHead title="Mga listing" sub="Fish listed for sale or redistribution across the platform." />
      <Seg value={f} onChange={setF} options={[['all', 'Lahat'], ...TYPES.map(t => [t, t] as [string, string])]} />
      <Table head={['Isda', 'Dami', 'Mangingisda', 'Natitirang oras', 'Panganib', 'Uri', 'Status']}>
        {LISTINGS.filter(l => f === 'all' || l.type === f).map((l, i) => (
          <tr key={i}>
            <td className="font-bold">{l.fish}</td><td>{l.qty}</td><td>{l.fisher}</td><td>{l.left}</td>
            <td><Badge risk={l.risk} /></td><td>{l.type}</td>
            <td><Chip tone={l.status === 'Naibenta' || l.status.startsWith('Tinanggap') ? 'ok' : l.status === 'Walang tugon' ? 'pend' : 'info'}>{l.status}</Chip></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}