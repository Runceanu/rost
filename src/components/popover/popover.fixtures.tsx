import { Popover } from './Popover'
import { Text } from '../text/Text'

// Figma's Popover: the plate, open, drawn in place.
const sample = (
  <Popover id="paid" preview>
    <Text variant="paragraph" tone="secondary">Paid on 4 November, by bank transfer.</Text>
  </Popover>
)
export const fixtures = [{ node: '738:48', name: 'popover', element: <div style={{ width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Popover } from 'rost/components/popover/Popover'

<button popovertarget="paid">Paid</button>
<Popover id="paid">
  <Text variant="paragraph" tone="secondary">Paid on 4 November, by bank transfer.</Text>
</Popover>`

/** What the component's card on rost.build shows. */
export const preview = sample
