import { Chip } from './Chip'

/** One fixture per Figma state. Hover, pressed and focus are forced by the test. Figma's Focus frame includes the ring, 4px outside. */
export const fixtures = [
  { node: '139:318', name: 'state=Default', element: <Chip>label</Chip> },
  { node: '139:320', name: 'state=Hover', element: <Chip>label</Chip>, force: ['hover'] },
  { node: '139:322', name: 'state=Pressed', element: <Chip>label</Chip>, force: ['active'] },
  { node: '139:326', name: 'state=Focus', element: <div style={{ display: 'inline-flex', padding: 4 }}><Chip>label</Chip></div>, force: ['focus', 'focus-visible'] },
  { node: '139:324', name: 'state=Disabled', element: <Chip disabled>label</Chip> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Chip } from 'rost/components/chips/Chip'

<div role="group" aria-label="Filter by category">
  <Chip aria-pressed="false">Product</Chip>
  <Chip aria-pressed="false">Brand</Chip>
</div>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 8 }}>
    <Chip tabIndex={-1}>Product</Chip>
    <Chip tabIndex={-1}>Brand</Chip>
    <Chip tabIndex={-1}>Web</Chip>
  </span>
)
