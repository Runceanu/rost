import { Tabs } from './Tabs'
import { Tab } from '../tab/Tab'
import arrow from '../toggle/icon-arrow-left.svg?url'

/**
 * Figma's tabs bar: Preview selected, Code, and Tokens with the leading arrow
 * Figma uses as its sample icon.
 */
const glyph = <span style={{ display: 'block', width: '100%', height: '100%', background: 'currentColor', mask: `url(${arrow}) center / contain no-repeat` }} />

const bar = (
  <Tabs aria-label="Sample">
    <Tab selected>Preview</Tab>
    <Tab>Code</Tab>
    <Tab leading={glyph}>Tokens</Tab>
  </Tabs>
)

export const fixtures = [{ node: '448:56', name: 'tabs', element: <div style={{ display: 'inline-block' }}>{bar}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Tabs } from 'rost/components/tabs/Tabs'
import { Tab } from 'rost/components/tab/Tab'

<Tabs aria-label="Invoice">
  <Tab selected aria-controls="panel-details">Details</Tab>
  <Tab aria-controls="panel-history">History</Tab>
</Tabs>`

/** What the component's card on rost.build shows: the same bar, drawn without buttons, since the card is a link. */
export const preview = (
  <span className="rost-tabs" style={{ display: 'inline-flex' }}>
    <Tab as="span" selected>Preview</Tab>
    <Tab as="span">Code</Tab>
    <Tab as="span" leading={glyph}>Tokens</Tab>
  </span>
)
