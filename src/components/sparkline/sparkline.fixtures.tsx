import { Sparkline } from './Sparkline'

// One fixture per Figma variant: seven months of income, 120 by 32.
const data = [4, 6, 5, 8, 7, 9, 12]
const NODES = { neutral: '753:13', positive: '753:17', negative: '753:21' }
export const fixtures = (['neutral', 'positive', 'negative'] as const).map((tone) => ({
  node: NODES[tone],
  name: `tone=${tone}`,
  element: <div style={{ display: 'flex', width: 'fit-content' }}><Sparkline tone={tone} data={data} label="Income, last seven months, up to €12,000" /></div>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Sparkline } from 'rost/components/sparkline/Sparkline'

<Sparkline tone="positive" data={incomeByMonth} label="Income, last seven months, up to €12,000" />`

/** What the component's card on rost.build shows. */
export const preview = <Sparkline tone="positive" data={data} width={160} label="Income, last seven months, up to €12,000" />
