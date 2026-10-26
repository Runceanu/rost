import { Tabs } from './Tabs'
import { TabItem } from '../tab-item/TabItem'
import arrow from '../toggle/icon-arrow-left.svg?url'

/**
 * Figma's tabs bar: Preview selected, Code, and Tokens with the leading arrow
 * Figma uses as its sample icon.
 */
const glyph = <span style={{ display: 'block', width: '100%', height: '100%', background: 'currentColor', mask: `url(${arrow}) center / contain no-repeat` }} />

const bar = (
  <Tabs aria-label="Sample">
    <TabItem selected>Preview</TabItem>
    <TabItem>Code</TabItem>
    <TabItem leading={glyph}>Tokens</TabItem>
  </Tabs>
)

export const fixtures = [{ node: '448:56', name: 'tabs', element: <div style={{ display: 'inline-block' }}>{bar}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Tabs } from 'rost/components/tabs/Tabs'
import { TabItem } from 'rost/components/tab-item/TabItem'

<Tabs aria-label="Invoice">
  <TabItem selected aria-controls="panel-details">Details</TabItem>
  <TabItem aria-controls="panel-history">History</TabItem>
</Tabs>`

/** What the component's card on rost.build shows: the same bar, drawn without buttons, since the card is a link. */
export const preview = (
  <span className="rost-tabs" style={{ display: 'inline-flex' }}>
    <TabItem as="span" selected>Preview</TabItem>
    <TabItem as="span">Code</TabItem>
    <TabItem as="span" leading={glyph}>Tokens</TabItem>
  </span>
)
