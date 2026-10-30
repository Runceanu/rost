import { Table } from '../table/Table'
import { TableRow } from './TableRow'
import { TableItem } from '../table-item/TableItem'

// TableRow started in code and was drawn in Figma after; the fixtures aren't
// compared with it yet. A `<tr>` only means something in a table, so each
// fixture is a small Table. Hover, press or tab to a linked row on the page
// to see its states.
const row = (props: { selected?: boolean; href?: string }, date = '15 Nov') => (
  <TableRow {...props}>
    <TableItem header="row" description="Income tax, instalment 2 of 3">{date}</TableItem>
    <TableItem numeric>€640</TableItem>
  </TableRow>
)
const frame = (r: React.ReactNode) => <div style={{ width: 320, maxWidth: '100%' }}><Table aria-label="Payments">{r}</Table></div>

export const fixtures = [
  { node: 'row:plain', name: 'plain', element: frame(row({})) },
  { node: 'row:link', name: 'link', element: frame(row({ href: '#15-nov' })) },
  { node: 'row:selected', name: 'link, selected', element: frame(row({ href: '#15-nov', selected: true })) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { TableRow } from 'rost/components/table-row/TableRow'

// A link: the header cell holds it, and the whole row is the target.
<TableRow href={\`/payments/\${p.id}\`} selected={p.id === current}>
  <TableItem header="row" description={p.label}>{p.date}</TableItem>
  <TableItem numeric>{eur(p.amount)}</TableItem>
</TableRow>

// Something you pick: the header cell holds a button with aria-pressed.
<TableRow onSelect={() => setPicked(p.id)} selected={p.id === picked}>…</TableRow>`

/** What the component's card on rost.build shows. No links: a card is one already. */
export const preview = frame(<>{row({ selected: true }, '31 Oct')}{row({})}</>)
