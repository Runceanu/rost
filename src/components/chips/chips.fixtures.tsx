import { Chip } from './Chip'

/** One fixture per Figma state. Hover, pressed and focus are forced by the test. Figma's Focus frame includes the ring, 4px outside. */
export const fixtures = [
  { node: '139:318', name: 'state=Default', element: <Chip>label</Chip> },
  { node: '139:320', name: 'state=Hover', element: <Chip>label</Chip>, force: ['hover'] },
  { node: '139:322', name: 'state=Pressed', element: <Chip>label</Chip>, force: ['active'] },
  { node: '139:326', name: 'state=Focus', element: <div style={{ display: 'inline-flex', padding: 'var(--spacing-gap-2xsmall)' }}><Chip>label</Chip></div>, force: ['focus', 'focus-visible'] },
  { node: '139:324', name: 'state=Disabled', element: <Chip disabled>label</Chip> },
  // Proposed, not in Figma yet, so nothing to compare with: the selected chip, after ListItem's selected row.
  { node: 'selected:default', name: 'state=Default, selected=True', element: <Chip selected>label</Chip> },
  { node: 'selected:disabled', name: 'state=Disabled, selected=True', element: <Chip selected disabled>label</Chip> },
  { node: 'selected:hover', name: 'state=Hover, selected=True', element: <Chip selected>label</Chip>, force: ['hover'] },
  { node: 'selected:focus', name: 'state=Focus, selected=True', element: <div style={{ display: 'inline-flex', padding: 'var(--spacing-gap-2xsmall)' }}><Chip selected>label</Chip></div>, force: ['focus', 'focus-visible'] },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Chip } from 'rost/components/chips/Chip'

<div role="group" aria-label="Filter by category">
  <Chip selected={filter === 'product'} onClick={() => setFilter('product')}>Product</Chip>
  <Chip selected={filter === 'brand'} onClick={() => setFilter('brand')}>Brand</Chip>
</div>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 'var(--spacing-gap-small)' }}>
    <Chip as="span" selected>Product</Chip>
    <Chip as="span">Brand</Chip>
    <Chip as="span">Web</Chip>
  </span>
)
