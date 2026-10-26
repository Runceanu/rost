import { TabItem } from './TabItem'

/**
 * One fixture per Figma variant, with Figma's sample label. Hover, pressed and
 * focus are forced by the test; selected and disabled are props.
 */
const NODES: [selected: boolean, state: string, node: string][] = [
  [true, 'Default', '442:2'], [true, 'Hover', '442:11'], [true, 'Pressed', '442:20'], [true, 'Focus', '442:29'], [true, 'Disabled', '442:39'],
  [false, 'Default', '442:48'], [false, 'Hover', '442:57'], [false, 'Pressed', '442:66'], [false, 'Focus', '442:75'], [false, 'Disabled', '442:85'],
]
const FORCE: Record<string, string[]> = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] }

export const fixtures = NODES.map(([selected, state, node]) => ({
  node,
  name: `selected=${selected ? 'True' : 'False'}, state=${state}`,
  element: <div role="tablist" aria-label="Sample" style={{ display: 'inline-flex' }}><TabItem selected={selected} disabled={state === 'Disabled'}>Tab</TabItem></div>,
  ...(FORCE[state] ? { force: FORCE[state] } : {}),
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Tabs } from 'rost/components/tabs/Tabs'
import { TabItem } from 'rost/components/tab-item/TabItem'

<Tabs aria-label="Invoice">
  <TabItem selected aria-controls="panel-details">Details</TabItem>
  <TabItem aria-controls="panel-history">History</TabItem>
</Tabs>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'inline-flex' }}>
    <TabItem as="span" selected>Preview</TabItem>
    <TabItem as="span">Code</TabItem>
  </span>
)
