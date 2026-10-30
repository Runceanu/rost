import { Table } from '../table/Table'
import { TableItem, type TableItemProps } from './TableItem'
import { Badge } from '../badge/Badge'

/**
 * One fixture per Figma variant, with Figma's sample: a Positive Badge in
 * `leading`, "Label" over "Description", and a Default Badge in `trailing`.
 * A cell only means something in a row, so each sits in a one-cell Table. The
 * row is a plain `<tr>`: TableRow's hairline and height belong to TableRow.
 */
const NODES: [header: TableItemProps['header'], numeric: boolean, node: string][] = [
  [undefined, false, '527:54'], [undefined, true, '527:66'], ['row', false, '527:78'],
  ['row', true, '527:90'], ['column', false, '527:102'], ['column', true, '527:114'],
]
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'None')

export const fixtures = NODES.map(([header, numeric, node]) => ({
  node,
  name: `header=${cap(header)}, numeric=${numeric ? 'True' : 'False'}`,
  element: (
    <Table aria-label="Sample" style={{ width: 'auto' }}>
      <tr>
        <TableItem header={header} numeric={numeric} leading={<Badge status="positive">label</Badge>} trailing={<Badge>label</Badge>} description="Description">Label</TableItem>
      </tr>
    </Table>
  ),
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { TableItem } from 'rost/components/table-item/TableItem'

<TableItem header="row" leading={<Badge status="warning">Income tax</Badge>} trailing={<Badge>estimate</Badge>} description="Instalment 2 of 3">
  15 Nov
</TableItem>
<TableItem numeric description="→ €1,310 projected">{eur(amount)}</TableItem>`

/** What the component's card on rost.build shows. */
export const preview = (
  <div style={{ width: 280, maxWidth: '100%' }}>
    <Table aria-label="Sample">
      <tr>
        <TableItem header="row" leading={<Badge status="positive">URSSAF</Badge>} description="Q3 contributions">31 Oct</TableItem>
        <TableItem numeric>€1,284</TableItem>
      </tr>
    </Table>
  </div>
)
