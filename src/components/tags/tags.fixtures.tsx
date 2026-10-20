import type { JSX } from 'react'
import { Tag } from './Tag'

/** One fixture per Figma state, as a linked tag: only those have states. */

// In a flex box, so the tag sits on whole pixels rather than on a line of text.
// Figma's Focus frame includes the ring, 4px outside.
const box = (tag: JSX.Element, pad = 0) => <div style={{ display: 'inline-flex', padding: pad }}>{tag}</div>

export const fixtures = [
  { node: '91:363', name: 'state=Default', element: box(<Tag href="#">label</Tag>) },
  { node: '91:372', name: 'state=Hover', element: box(<Tag href="#">label</Tag>), force: ['hover'] },
  { node: '91:383', name: 'state=Pressed', element: box(<Tag href="#">label</Tag>), force: ['active'] },
  { node: '91:403', name: 'state=Focus', element: box(<Tag href="#">label</Tag>, 4), force: ['focus', 'focus-visible'] },
  { node: '91:394', name: 'state=Disabled', element: box(<Tag href="#" disabled>label</Tag>) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Tag } from 'rost/components/tags/Tag'

<Tag>Fintech</Tag>
<Tag href="/work?tag=fintech" aria-label="Projects tagged Fintech">Fintech</Tag>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 8 }}>
    <Tag>Fintech</Tag>
    <Tag>Product</Tag>
    <Tag>2025</Tag>
  </span>
)
