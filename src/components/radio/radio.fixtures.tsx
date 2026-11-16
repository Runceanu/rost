import { Radio } from './Radio'

// One fixture per Figma variant, with its words, the way it's used. Hover and
// pressed are forced on the label, focus on the hidden input. A focused one's
// frame has the ring, 4px outside the circle.
type V = [state: 'Default' | 'Hover' | 'Pressed' | 'Focus' | 'Disabled', checked: boolean, node: string]
const VARIANTS: V[] = [
  ['Default', false, '733:73'], ['Hover', false, '733:78'], ['Pressed', false, '733:83'], ['Focus', false, '733:88'], ['Disabled', false, '733:93'],
  ['Default', true, '733:98'], ['Hover', true, '733:103'], ['Pressed', true, '733:108'], ['Focus', true, '733:113'], ['Disabled', true, '733:118'],
]
const FORCE = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] } as Record<string, string[]>

export const fixtures = VARIANTS.map(([state, checked, node]) => {
  const el = <Radio name={`radio-often-${node}`} checked={checked} disabled={state === 'Disabled'} onChange={() => {}}>Every month</Radio>
  return {
    node,
    name: `state=${state}, checked=${checked ? 'True' : 'False'}`,
    // A fit-content flex box, so the 20px row doesn't sit in a taller line of text.
    element: <div style={{ display: 'flex', width: 'fit-content', padding: state === 'Focus' ? 4 : 0 }}>{el}</div>,
    ...(FORCE[state] ? { force: FORCE[state] } : {}),
    ...(state === 'Focus' ? { forceOn: '.rost-radio__input' } : {}),
  }
})

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Radio } from 'rost/components/radio/Radio'

<fieldset>
  <legend>How often do you invoice?</legend>
  <Radio name="often" value="month" defaultChecked>Every month</Radio>
  <Radio name="often" value="quarter">Every quarter</Radio>
</fieldset>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'grid', gap: 'var(--spacing-gap-small)' }}>
    <Radio name="preview-often" defaultChecked tabIndex={-1}>Every month</Radio>
    <Radio name="preview-often" tabIndex={-1}>Every quarter</Radio>
  </span>
)
