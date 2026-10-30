import type { JSX } from 'react'
import { Textarea } from './Textarea'

/**
 * One fixture per Figma variant. Figma's frame includes the help line under
 * the field (120px tall in all); a focused one also has the ring, 4px outside
 * (288 by 124). Hover is forced by the test. Chrome's resize handle in the
 * corner is the one thing Figma doesn't draw, and it's within tolerance.
 */
type V = [state: 'Default' | 'Hover' | 'Disabled', selected: boolean, error: boolean, node: string]
const VARIANTS: V[] = [
  ['Default', false, false, '528:761'], ['Hover', false, false, '528:767'], ['Default', true, false, '528:773'],
  ['Disabled', false, false, '528:780'], ['Default', false, true, '528:786'], ['Hover', false, true, '528:795'],
  ['Default', true, true, '528:804'],
]
const frame = (el: JSX.Element, selected: boolean) =>
  <div style={selected ? { width: 280, height: 120, padding: '4px 4px 0' } : { width: 280, height: 120 }}>{el}</div>

export const fixtures = VARIANTS.map(([state, selected, error, node]) => ({
  node,
  name: `state=${state}, selected=${selected ? 'True' : 'False'}, error=${error ? 'True' : 'False'}`,
  element: frame(
    <Textarea label="Note" supportive={error ? 'Keep it under 500 characters.' : 'Only you see this.'} readOnly
      defaultValue="Paid in two parts. The second half lands in March." selected={selected} error={error} disabled={state === 'Disabled'} />,
    selected,
  ),
  ...(state === 'Hover' ? { force: ['hover'] } : {}),
})).concat([
  // Not a Figma frame: one with no `selected`, so it follows focus the way it does in use. bin/a11y.mjs tabs to it.
  { node: 'textarea:live', name: 'follows focus', element: frame(<Textarea label="Note" supportive="Only you see this." readOnly />, false) },
])

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Textarea } from 'rost/components/textarea/Textarea'

<Textarea label="Note" supportive="Only you see this." />
<Textarea label="Note" error supportive="Keep it under 500 characters." />`

/**
 * What the component's card on rost.build shows. The card is a link, and a
 * link can't hold a `<textarea>`, so this is Textarea's own markup with the
 * value as text.
 */
export const preview = (
  <span style={{ display: 'block', width: 220 }}>
    <span className="rost-textarea" style={{ display: 'flex' }}>
      <span className="rost-textarea__outline" />
      <span className="rost-textarea__header"><span className="rost-textarea__label">Note</span></span>
      <span className="rost-textarea__value" style={{ display: 'block', whiteSpace: 'normal' }}>Paid in two parts. The second half lands in March.</span>
      <span className="rost-textarea__supportive">Only you see this.</span>
    </span>
  </span>
)
