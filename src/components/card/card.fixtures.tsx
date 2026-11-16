import { Card } from './Card'
import { Text } from '../text/Text'

const NODES = ["733:145", "733:148"]

// One fixture per Figma variant, 280 wide. The sample is words: at 56px a
// row of digits lands a pixel apart in Chrome and Figma, and their flat
// bottoms make one long line of difference. Text checks its own headline.
const inside = (
  <>
    <Text variant="label" tone="secondary">Tax set aside</Text>
    <Text variant="headline" tone="primary">On track</Text>
  </>
)
export const fixtures = (['filled', 'outlined'] as const).map((tone, i) => ({
  node: NODES[i],
  name: `tone=${tone}`,
  element: <Card tone={tone} style={{ width: 280 }}>{inside}</Card>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Card } from 'rost/components/card/Card'

<Card>
  <Text variant="label" tone="secondary">Tax set aside</Text>
  <Text variant="headline">€4,210</Text>
</Card>`

/** What the component's card on rost.build shows. */
export const preview = <Card style={{ width: 200 }}>{inside}</Card>
