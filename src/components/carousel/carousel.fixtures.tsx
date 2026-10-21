import { Carousel } from './Carousel'

/**
 * One fixture per Figma state, with Figma's sample text. Hover, pressed and
 * focus are forced by the test. Figma's Focus frame includes the ring, 4px outside.
 */
const card = (props = {}) => <Carousel href="#" style={{ width: 312 }} {...props} />

export const fixtures = [
  { node: '157:303', name: 'state=Default', element: card() },
  { node: '157:360', name: 'state=Hover', element: card(), force: ['hover'] },
  { node: '157:331', name: 'state=Pressed', element: card(), force: ['active'] },
  { node: '157:345', name: 'state=Focus', element: <div style={{ display: 'inline-flex', padding: 'var(--spacing-gap-2xsmall)' }}>{card()}</div>, force: ['focus', 'focus-visible'] },
  { node: '157:317', name: 'state=Disabled', element: card({ disabled: true }) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Carousel } from 'rost/components/carousel/Carousel'

<Carousel href="/work/akount" number="01" title="akount.ing" description="Bookkeeping that explains itself." />`

/** What the component's card on rost.build shows. */
export const preview = <Carousel as="div" number="01" title="akount.ing" description="Bookkeeping that explains itself." style={{ width: 240 }} />
