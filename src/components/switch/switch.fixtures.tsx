import { Switch } from './Switch'

// Switch started in code, not Figma, so there's no screenshot to compare
// with. These are the looks the page shows; hover, press and focus are left
// for you to try on the real thing.
export const fixtures = [
  { node: 'switch:off', name: 'state=Default, checked=False', element: <Switch>Email me receipts</Switch> },
  { node: 'switch:on', name: 'state=Default, checked=True', element: <Switch checked>Email me receipts</Switch> },
  { node: 'switch:disabled-off', name: 'state=Disabled, checked=False', element: <Switch disabled>Email me receipts</Switch> },
  { node: 'switch:disabled-on', name: 'state=Disabled, checked=True', element: <Switch disabled checked>Email me receipts</Switch> },
  { node: 'switch:hover-off', name: 'state=Hover, checked=False', element: <Switch>Email me receipts</Switch>, force: ['hover'] },
  { node: 'switch:focus-on', name: 'state=Focus, checked=True', element: <div style={{ display: 'inline-flex', padding: 'var(--spacing-gap-2xsmall)' }}><Switch checked>Email me receipts</Switch></div>, force: ['focus', 'focus-visible'] },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Switch } from 'rost/components/switch/Switch'

<Switch checked={receipts} onCheckedChange={setReceipts}>
  Email me receipts
</Switch>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gap-small-medium)' }}>
    <Switch as="span" checked>Email me receipts</Switch>
    <Switch as="span">Show cents</Switch>
  </span>
)
