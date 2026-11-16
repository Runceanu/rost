import { Stat } from './Stat'

// One fixture per Figma variant.
const NODES = ['743:27', '743:31', '743:35']
const DELTA = { positive: 'Up 12% on October', negative: 'Down 8% on October', neutral: 'Same as October' } as const
export const fixtures = (['positive', 'negative', 'neutral'] as const).map((tone, i) => ({
  node: NODES[i],
  name: `tone=${tone}`,
  element: <div style={{ width: 'fit-content' }}><Stat label="Paid this month" value="€12,480" delta={DELTA[tone]} tone={tone} /></div>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Stat } from 'rost/components/stat/Stat'

<Stat label="Paid this month" value="€12,480" delta="Up 12% on October" tone="positive" />`

/** What the component's card on rost.build shows. */
export const preview = <Stat label="Paid this month" value="€12,480" delta="Up 12% on October" tone="positive" />
