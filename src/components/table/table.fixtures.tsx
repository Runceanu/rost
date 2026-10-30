import { Table } from './Table'
import { TableRow } from '../table-row/TableRow'
import { TableItem } from '../table-item/TableItem'
import { Badge } from '../badge/Badge'

// The first fixture is Figma's table (527:596): the accounting app's payment
// schedule, with invented amounts. The others show what Figma doesn't draw.
const payments = [
  { kind: 'URSSAF', status: 'positive', date: '31 Oct', what: 'Q3 contributions', amount: '€1,284' },
  { kind: 'Income tax', status: 'warning', date: '15 Nov', what: 'Instalment 2 of 3', amount: '€640', estimate: true },
  { kind: 'URSSAF', status: 'positive', date: '31 Jan', what: 'Q4 contributions', amount: '€1,310', estimate: true },
] as const

const rows = (linked: boolean) => payments.map((p) => (
  <TableRow key={p.date} href={linked ? `#${p.date}` : undefined}>
    <TableItem header="row" leading={<Badge status={p.status}>{p.kind}</Badge>} trailing={'estimate' in p && <Badge>estimate</Badge>} description={p.what}>{p.date}</TableItem>
    <TableItem numeric>{p.amount}</TableItem>
  </TableRow>
))

const head = (
  <TableRow>
    <TableItem header="column">Payment</TableItem>
    <TableItem header="column" numeric>Amount</TableItem>
  </TableRow>
)

const frame = (table: React.ReactNode) => <div style={{ width: 360, maxWidth: '100%' }}>{table}</div>

export const fixtures = [
  { node: '527:596', name: 'with a caption', element: frame(<Table caption="What to pay, and when">{rows(false)}</Table>) },
  { node: 'table:links', name: 'rows as links', element: frame(<Table caption="What to pay, and when">{rows(true)}</Table>) },
  { node: 'table:head', name: 'with column headers', element: frame(<Table aria-label="Payments" head={head}>{rows(false)}</Table>) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Table } from 'rost/components/table/Table'
import { TableRow } from 'rost/components/table-row/TableRow'
import { TableItem } from 'rost/components/table-item/TableItem'

<Table caption="What to pay, and when">
  {payments.map((p) => (
    <TableRow key={p.id} href={\`/payments/\${p.id}\`}>
      <TableItem header="row" leading={<Badge status="positive">URSSAF</Badge>} description={p.label}>
        {p.date}
      </TableItem>
      <TableItem numeric>{eur(p.amount)}</TableItem>
    </TableRow>
  ))}
</Table>`

/** What the component's card on rost.build shows. No links: a card is one already. */
export const preview = frame(<Table caption="What to pay, and when">{rows(false).slice(0, 2)}</Table>)
