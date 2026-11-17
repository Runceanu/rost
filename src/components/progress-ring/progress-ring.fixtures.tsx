import { ProgressRing } from './ProgressRing'

// One fixture per Figma variant, 65% of the way round.
const NODES = { positive: '749:11', warning: '749:14', negative: '749:17' }
export const fixtures = (['positive', 'warning', 'negative'] as const).map((tone) => ({
  node: NODES[tone],
  name: `tone=${tone}`,
  element: <div style={{ display: 'flex', width: 'fit-content' }}><ProgressRing tone={tone} value={65} label="Tax set aside for 2026" /></div>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { ProgressRing } from 'rost/components/progress-ring/ProgressRing'

<ProgressRing value={4550} max={7000} label="Tax set aside for 2026" />`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 'var(--spacing-gap-medium)' }}>
    <ProgressRing value={65} label="Tax set aside" />
    <ProgressRing value={90} tone="warning" label="Budget used" />
  </span>
)
