import { Table } from '../table/Table'
import { TableRow } from './TableRow'
import { TableItem } from '../table-item/TableItem'

/**
 * One fixture per Figma variant: "15 Nov" over its description, and €640.
 * A `<tr>` only means something in a table, so each is a one-row Table. The
 * rows are links, since only a row with a link reacts: hover, press and focus
 * are forced on the link, and the row draws them.
 */
const NODES: [state: string, selected: boolean, node: string][] = [
  ['Default', false, '527:163'], ['Default', true, '527:217'], ['Hover', false, '527:255'], ['Hover', true, '527:293'],
  ['Pressed', false, '527:331'], ['Pressed', true, '527:369'], ['Focus', false, '527:407'], ['Focus', true, '527:445'],
]
// A selected row keeps its hover fill while it's pressed, so Pressed is hover and active together.
const FORCE: Record<string, string[]> = { Hover: ['hover'], Pressed: ['hover', 'active'], Focus: ['focus', 'focus-visible'] }

const row = (props: { selected?: boolean; href?: string }, date = '15 Nov') => (
  <TableRow {...props}>
    <TableItem header="row" description="Income tax, instalment 2 of 3">{date}</TableItem>
    <TableItem numeric>€640</TableItem>
  </TableRow>
)
const frame = (r: React.ReactNode, width = 360) => <div style={{ width, maxWidth: '100%' }}><Table aria-label="Payments">{r}</Table></div>

export const fixtures = NODES.map(([state, selected, node]) => ({
  node,
  name: `state=${state}, selected=${selected ? 'True' : 'False'}`,
  element: frame(row({ href: '#15-nov', selected })),
  ...(FORCE[state] ? { force: FORCE[state], forceOn: '.rost-table-item__action' } : {}),
}))

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
export const preview = frame(<>{row({ selected: true }, '31 Oct')}{row({})}</>, 300)
