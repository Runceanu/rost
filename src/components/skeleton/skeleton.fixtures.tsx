import { Skeleton } from './Skeleton'

// One fixture per Figma variant. Text and block are 240 wide, as they'd be in a card.
export const fixtures = [
  { node: '733:156', name: 'shape=text', element: <div style={{ width: 240 }}><Skeleton shape="text" /></div> },
  { node: '733:157', name: 'shape=circle', element: <Skeleton shape="circle" /> },
  { node: '733:158', name: 'shape=block', element: <div style={{ width: 240 }}><Skeleton shape="block" /></div> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Skeleton } from 'rost/components/skeleton/Skeleton'

<div aria-busy="true">
  <Skeleton shape="circle" />
  <Skeleton />
  <Skeleton width="60%" />
</div>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 'var(--spacing-gap-small)', alignItems: 'center', width: 200 }}>
    <Skeleton shape="circle" />
    <span style={{ display: 'grid', gap: 'var(--spacing-gap-small)', flex: 1 }}>
      <Skeleton />
      <Skeleton width="60%" />
    </span>
  </span>
)
