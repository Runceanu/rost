import type { JSX } from 'react'
import { Input } from './Input'

/**
 * One fixture per Figma variant, with Figma's sample text. Figma's frame
 * includes the help text under the field (72px tall); a focused one also
 * has the ring, 4px outside (216 by 76). Hover is forced by the test.
 */
type V = [state: 'Default' | 'Hover' | 'Disabled', filled: boolean, selected: boolean, error: boolean, node: string]
const VARIANTS: V[] = [
  ['Default', false, false, false, '240:274'], ['Hover', false, false, false, '240:277'],
  ['Default', false, true, false, '244:726'], ['Disabled', false, false, false, '244:760'],
  ['Default', false, false, true, '252:1014'], ['Default', true, false, true, '252:1024'],
  ['Default', false, true, true, '252:1052'], ['Default', true, true, true, '252:1064'],
  ['Hover', false, false, true, '252:1076'], ['Hover', true, false, true, '252:1086'],
  ['Default', true, false, false, '252:836'], ['Disabled', true, false, false, '252:847'],
  ['Default', true, true, false, '252:856'], ['Hover', true, false, false, '252:868'],
]
const frame = (el: JSX.Element, selected: boolean) =>
  <div style={selected ? { width: 208, height: 72, padding: '4px 4px 0' } : { width: 208, height: 72 }}>{el}</div>

export const fixtures = VARIANTS.map(([state, filled, selected, error, node]) => ({
  node,
  name: `state=${state}, configuration=${filled ? 'Filled' : 'Empty'}, selected=${selected ? 'True' : 'False'}, error=${error ? 'True' : 'False'}`,
  element: frame(
    <Input label="label" supportive="Supportive" placeholder="placeholder" readOnly
      value={filled ? 'placeholder' : ''} selected={selected} error={error} disabled={state === 'Disabled'} onClear={() => {}} />,
    selected,
  ),
  ...(state === 'Hover' ? { force: ['hover'] } : {}),
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Input } from 'rost/components/input/Input'

<Input label="Email address" type="email" supportive="We'll send the receipt here." />
<Input label="Amount" error supportive="Use a number, like 1200." />`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'block', width: 208 }}>
    <Input label="Email address" value="name@example.com" readOnly supportive="We'll send the receipt here." tabIndex={-1} />
  </span>
)
