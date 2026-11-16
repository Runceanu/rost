import { EmptyState } from './EmptyState'
import { Illustration } from '../illustration/Illustration'
import { Button } from '../button/Button'

// Figma's EmptyState: no invoices yet, 400 wide.
const sample = (
  <EmptyState illustration={<Illustration name="design-system" />} title="No invoices yet" action={<Button>New invoice</Button>}>
    When you send your first one, it shows up here with what's paid and what's due.
  </EmptyState>
)
export const fixtures = [{ node: '742:62', name: 'empty-state', element: <div style={{ width: 400 }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { EmptyState } from 'rost/components/empty-state/EmptyState'

<EmptyState
  illustration={<Illustration name="design-system" />}
  title="No invoices yet"
  action={<Button onClick={create}>New invoice</Button>}
>
  When you send your first one, it shows up here with what's paid and what's due.
</EmptyState>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', transform: 'scale(0.7)', pointerEvents: 'none' }}>{sample}</span>
