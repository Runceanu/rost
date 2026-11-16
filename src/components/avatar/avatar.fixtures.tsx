import { Avatar } from './Avatar'

const NODES = ["733:133", "733:135", "733:137"]

// One fixture per Figma variant: the initials, at each size.
export const fixtures = (['small', 'medium', 'large'] as const).map((size, i) => ({
  node: NODES[i],
  name: `size=${size}`,
  element: <Avatar name="Client One" size={size} />,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Avatar } from 'rost/components/avatar/Avatar'

<Avatar name="Client One" />
<Avatar name="Client One" src={photo} size="large" />`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 'var(--spacing-gap-small)', alignItems: 'center' }}>
    <Avatar name="Client One" size="small" />
    <Avatar name="Client Two" />
    <Avatar name="Client Three" size="large" />
  </span>
)
