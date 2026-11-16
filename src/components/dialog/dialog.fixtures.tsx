import { Dialog } from './Dialog'
import { Button } from '../button/Button'

// Figma's Dialog: the plate, drawn in place without the modal.
const sample = (
  <Dialog preview title="Delete this invoice?" actions={<><Button variant="secondary">Keep it</Button><Button>Delete</Button></>}>
    It's gone for good, and so is its number.
  </Dialog>
)
export const fixtures = [{ node: '738:35', name: 'dialog', element: <div style={{ width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Dialog } from 'rost/components/dialog/Dialog'

<Dialog
  open={asking}
  onClose={() => setAsking(false)}
  title="Delete this invoice?"
  actions={<>
    <Button variant="secondary" onClick={() => setAsking(false)}>Keep it</Button>
    <Button onClick={remove}>Delete</Button>
  </>}
>
  It's gone for good, and so is its number.
</Dialog>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', transform: 'scale(0.6)', transformOrigin: 'center', pointerEvents: 'none' }}>{sample}</span>
