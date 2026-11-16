import { Checkbox } from './Checkbox'

// One fixture per Figma variant, with its words, the way it's used. Hover and
// pressed are forced on the label, focus on the hidden input. A focused one's
// frame has the ring, 4px outside the box.
type V = [state: 'Default' | 'Hover' | 'Pressed' | 'Focus' | 'Disabled', checked: boolean, node: string]
const VARIANTS: V[] = [
  ['Default', false, '733:3'], ['Hover', false, '733:9'], ['Pressed', false, '733:15'], ['Focus', false, '733:21'], ['Disabled', false, '733:27'],
  ['Default', true, '733:33'], ['Hover', true, '733:39'], ['Pressed', true, '733:45'], ['Focus', true, '733:51'], ['Disabled', true, '733:57'],
]
const FORCE = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] } as Record<string, string[]>

export const fixtures = VARIANTS.map(([state, checked, node]) => {
  const el = <Checkbox name={`checkbox-vat-${node}`} checked={checked} disabled={state === 'Disabled'} onChange={() => {}}>Include VAT</Checkbox>
  return {
    node,
    name: `state=${state}, checked=${checked ? 'True' : 'False'}`,
    // A fit-content flex box, so the 20px row doesn't sit in a taller line of text.
    element: <div style={{ display: 'flex', width: 'fit-content', padding: state === 'Focus' ? 4 : 0 }}>{el}</div>,
    ...(FORCE[state] ? { force: FORCE[state] } : {}),
    ...(state === 'Focus' ? { forceOn: '.rost-checkbox__input' } : {}),
  }
})

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Checkbox } from 'rost/components/checkbox/Checkbox'

<Checkbox name="vat" checked={vat} onCheckedChange={setVat}>Include VAT</Checkbox>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'grid', gap: 'var(--spacing-gap-small)' }}>
    <Checkbox defaultChecked tabIndex={-1}>Include VAT</Checkbox>
    <Checkbox tabIndex={-1}>Round to whole euros</Checkbox>
  </span>
)
