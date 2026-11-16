import { Progress } from './Progress'

const NODES = ["733:165", "733:167", "733:169"]

// One fixture per Figma variant: 240 wide, 60% along.
export const fixtures = (['positive', 'warning', 'negative'] as const).map((tone, i) => ({
  node: NODES[i],
  name: `tone=${tone}`,
  element: <div style={{ width: 240 }}><Progress tone={tone} value={60} label="Tax set aside for 2026" /></div>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Progress } from 'rost/components/progress/Progress'

<Progress value={4210} max={7000} label="Tax set aside for 2026" />`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'grid', gap: 'var(--spacing-gap-medium)', width: 200 }}>
    <Progress value={60} label="Tax set aside" />
    <Progress value={90} tone="warning" label="Budget used" />
  </span>
)
