import { Sheet } from './Sheet'
import { Button } from '../button/Button'

// Figma's Sheet: the plate, drawn in place without the modal, 360 tall.
const sample = (
  <Sheet preview title="Edit client" actions={<><Button variant="secondary">Cancel</Button><Button>Save</Button></>}>
    Changes to the name and address show on the next invoice you send.
  </Sheet>
)
export const fixtures = [{ node: '744:3', name: 'sheet', element: <div style={{ width: 'fit-content', height: 360 }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Sheet } from 'rost/components/sheet/Sheet'

<Sheet open={editing} onClose={() => setEditing(false)} title="Edit client"
  actions={<><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
  <ClientForm />
</Sheet>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', height: 240, transform: 'scale(0.55)', transformOrigin: 'top center', pointerEvents: 'none' }}>{sample}</span>
