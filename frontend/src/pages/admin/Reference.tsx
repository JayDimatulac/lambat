import { Card, CardHead, Table } from './ui'
import { SHELF_LIFE } from './data'

export default function Reference() {
  return (
    <Card>
      <CardHead title="Shelf-life reference" sub="Base marketable hours by species and ice condition. Used by the estimator." />
      <Table head={['Isda', 'Buong yelo', 'May kaunting yelo', 'Walang yelo', 'Value-add']}>
        {SHELF_LIFE.map(r => <tr key={r[0]}><td className="font-bold">{r[0]}</td>{r.slice(1).map((c, i) => <td key={i}>{c}</td>)}</tr>)}
      </Table>
      <p className="mt-4 text-xs italic text-ink-soft">Estimate only. Not a food-safety test.</p>
    </Card>
  )
}