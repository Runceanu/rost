import type { ReactElement } from 'react'
import { DateField } from './DateField'

// One fixture per Figma variant, Select's seven, 208 wide. Hover is forced on
// the box, focus on the button.
const N = { def: '752:3', hov: '752:9', foc: '752:15', dis: '752:22', edef: '752:28', ehov: '752:35', efoc: '752:42' }
const field = (disabled = false, error = false) => (
  <DateField label="Invoice date" value={new Date(2026, 10, 17)} today={new Date(2026, 10, 17)} disabled={disabled} error={error} supportive={error ? 'An invoice can’t be dated after today' : undefined} />
)
const ring = (el: ReactElement) => <div style={{ padding: 4, width: 'fit-content' }}>{el}</div>
export const fixtures = [
  { node: N.def, name: 'state=Default, error=False', element: field() },
  { node: N.hov, name: 'state=Hover, error=False', force: ['hover'], element: field() },
  { node: N.foc, name: 'state=Focus, error=False', force: ['focus', 'focus-visible'], forceOn: '.rost-date-field__field', element: ring(field()) },
  { node: N.dis, name: 'state=Disabled, error=False', element: field(true) },
  // The help line sits under the field, outside its box, so it isn't in the picture.
  { node: N.edef, name: 'state=Default, error=True', element: field(false, true) },
  { node: N.ehov, name: 'state=Hover, error=True', force: ['hover'], element: field(false, true) },
  { node: N.efoc, name: 'state=Focus, error=True', force: ['focus', 'focus-visible'], forceOn: '.rost-date-field__field', element: ring(field(false, true)) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { DateField } from 'rost/components/date-field/DateField'

<DateField label="Invoice date" value={date} onValueChange={setDate} max={new Date()} />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', pointerEvents: 'none' }}>{field()}</span>
