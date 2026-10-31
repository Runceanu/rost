import { Switch } from './Switch'

// One fixture per Figma variant. Hover, pressed and focus are forced by the
// test. A focused one's frame has the ring, 4px outside the track.
type V = [state: 'Default' | 'Hover' | 'Pressed' | 'Focus' | 'Disabled', checked: boolean, node: string]
const VARIANTS: V[] = [
  ['Default', false, '528:350'], ['Hover', false, '528:355'], ['Pressed', false, '528:360'], ['Focus', false, '528:365'], ['Disabled', false, '528:371'],
  ['Default', true, '528:376'], ['Hover', true, '528:381'], ['Pressed', true, '528:386'], ['Focus', true, '528:391'], ['Disabled', true, '528:397'],
]
const FORCE = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] } as Record<string, string[]>

export const fixtures = VARIANTS.map(([state, checked, node]) => {
  const sw = <Switch aria-label="Email me receipts" checked={checked} disabled={state === 'Disabled'} />
  return {
    node,
    name: `state=${state}, checked=${checked ? 'True' : 'False'}`,
    element: state === 'Focus' ? <div style={{ display: 'inline-flex', padding: 4 }}>{sw}</div> : sw,
    ...(FORCE[state] ? { force: FORCE[state] } : {}),
  }
})

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Switch } from 'rost/components/switch/Switch'

<Switch aria-label="Email me receipts" checked={receipts} onCheckedChange={setReceipts} />

// With words beside it, use SwitchField.`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 'var(--spacing-gap-medium)' }}>
    <Switch as="span" checked />
    <Switch as="span" />
  </span>
)
