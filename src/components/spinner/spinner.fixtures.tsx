import { Spinner } from './Spinner'

// One fixture per Figma variant. The test stops animations, so each is
// compared at its first frame, which is what Figma draws.
const NODES = ['742:14', '742:17']
export const fixtures = (['small', 'medium'] as const).map((size, i) => ({
  node: NODES[i],
  name: `size=${size}`,
  // A fit-content flex box, so the ring doesn't sit in a taller line of text.
  element: <div style={{ display: 'flex', width: 'fit-content' }}><Spinner size={size} label="Saving" /></div>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Spinner } from 'rost/components/spinner/Spinner'

<Spinner label="Syncing with the bank" />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'flex', gap: 'var(--spacing-gap-medium)', alignItems: 'center' }}><Spinner size="small" /><Spinner /></span>
