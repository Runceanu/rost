import { SwitchField } from './SwitchField'

// One fixture per Figma variant: the label on either side, and disabled. The
// switch's own states are Switch's fixtures.
type V = [side: 'left' | 'right', disabled: boolean, node: string]
const VARIANTS: V[] = [
  ['right', false, '545:33'], ['left', false, '545:39'],
  ['right', true, '545:45'], ['left', true, '545:51'],
]
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

export const fixtures = VARIANTS.map(([side, disabled, node]) => ({
  node,
  name: `side=${cap(side)}, disabled=${disabled ? 'True' : 'False'}`,
  element: <SwitchField side={side} disabled={disabled} defaultChecked>Email me receipts</SwitchField>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { SwitchField } from 'rost/components/switch-field/SwitchField'

<SwitchField checked={receipts} onCheckedChange={setReceipts}>
  Email me receipts
</SwitchField>

<SwitchField side="left" defaultChecked>Show cents</SwitchField>`

/** What the component's card on rost.build shows. A card is a link, so these are drawn without buttons. */
export const preview = (
  <span style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gap-small-medium)' }}>
    <span className="rost-switch-field rost-switch-field--side-right">
      <span className="rost-switch rost-switch--checked rost-switch-field__switch"><span className="rost-switch__track"><span className="rost-switch__background" /><span className="rost-switch__thumb" /></span></span>
      <span className="rost-switch-field__label">Email me receipts</span>
    </span>
    <span className="rost-switch-field rost-switch-field--side-right">
      <span className="rost-switch rost-switch-field__switch"><span className="rost-switch__track"><span className="rost-switch__background" /><span className="rost-switch__thumb" /></span></span>
      <span className="rost-switch-field__label">Show cents</span>
    </span>
  </span>
)
