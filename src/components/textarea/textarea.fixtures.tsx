import type { JSX } from 'react'
import { Textarea } from './Textarea'

// Textarea started in code, not Figma, so there's no screenshot to compare
// with. One fixture per look the contract draws, with Input's sample text.
// The frame leaves room for the help line under the field and the ring around it.
type V = [state: 'Default' | 'Hover' | 'Disabled', selected: boolean, error: boolean]
const VARIANTS: V[] = [
  ['Default', false, false], ['Hover', false, false], ['Default', true, false], ['Disabled', false, false],
  ['Default', false, true], ['Hover', false, true], ['Default', true, true],
]
const frame = (el: JSX.Element) => <div style={{ width: 280, padding: '4px 4px 20px' }}>{el}</div>
const name = (state: string, selected: boolean, error: boolean) =>
  `state=${state}, selected=${selected ? 'True' : 'False'}, error=${error ? 'True' : 'False'}`

export const fixtures = VARIANTS.map(([state, selected, error]) => ({
  node: `textarea:${state.toLowerCase()}${selected ? '-selected' : ''}${error ? '-error' : ''}`,
  name: name(state, selected, error),
  element: frame(
    <Textarea label="Note" supportive={error ? 'Keep it under 500 characters.' : 'Only you see this.'} readOnly
      defaultValue="Paid in two parts. The second half lands in March." selected={selected} error={error} disabled={state === 'Disabled'} />,
  ),
  ...(state === 'Hover' ? { force: ['hover'] } : {}),
}))

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
