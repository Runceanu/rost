import { Table } from '../table/Table'
import { TableRow } from '../table-row/TableRow'
import { TableItem } from './TableItem'
import { Badge } from '../badge/Badge'

// TableItem started in code. A cell only means something in a row, so each
// fixture is a one-row Table.
const frame = (cells: React.ReactNode) => <div style={{ width: 280, maxWidth: '100%' }}><Table aria-label="Sample"><TableRow>{cells}</TableRow></Table></div>

export const fixtures = [
  { node: 'item:data', name: 'header=None', element: frame(<TableItem description="Q3 contributions">31 Oct</TableItem>) },
  { node: 'item:row', name: 'header=Row', element: frame(<TableItem header="row" leading={<Badge status="positive">URSSAF</Badge>} description="Q3 contributions">31 Oct</TableItem>) },
  { node: 'item:trailing', name: 'header=Row, trailing', element: frame(<TableItem header="row" trailing={<Badge>estimate</Badge>} description="Instalment 2 of 3">15 Nov</TableItem>) },
  { node: 'item:column', name: 'header=Column', element: frame(<><TableItem header="column">Payment</TableItem><TableItem header="column" numeric>Amount</TableItem></>) },
  { node: 'item:numeric', name: 'numeric=True', element: frame(<TableItem numeric description="→ €1,310 projected">−€1,284</TableItem>) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { TableItem } from 'rost/components/table-item/TableItem'

<TableItem header="row" leading={<Badge status="warning">Income tax</Badge>} trailing={<Badge>estimate</Badge>} description="Instalment 2 of 3">
  15 Nov
</TableItem>
<TableItem numeric description="→ €1,310 projected">{eur(amount)}</TableItem>`

/** What the component's card on rost.build shows. */
export const preview = frame(<><TableItem header="row" leading={<Badge status="positive">URSSAF</Badge>} description="Q3 contributions">31 Oct</TableItem><TableItem numeric>€1,284</TableItem></>)
