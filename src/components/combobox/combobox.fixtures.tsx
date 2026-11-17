import type { ReactElement } from 'react'
import { Combobox } from './Combobox'

// One fixture per Figma variant, Select's seven, 208 wide, with a client
// picked. Hover is forced on the box, focus on the input.
const N = { def: '756:11', hov: '756:17', foc: '756:23', dis: '756:30', edef: '756:36', ehov: '756:43', efoc: '756:50' }
const clients = [
  { value: 'c1', label: 'Client One' }, { value: 'c2', label: 'Client Two' }, { value: 'c3', label: 'Client Three' },
  { value: 'c4', label: 'Client Four' }, { value: 'c5', label: 'Client Five' }, { value: 'c6', label: 'Client Six' }, { value: 'c7', label: 'Client Seven' },
]
const field = (disabled = false, error = false) => (
  <Combobox label="Client" options={clients} value="c1" disabled={disabled} error={error} supportive={error ? 'This client has no VAT number yet' : undefined} />
)
const ring = (el: ReactElement) => <div style={{ padding: 4, width: 'fit-content' }}>{el}</div>
export const fixtures = [
  { node: N.def, name: 'state=Default, error=False', element: field() },
  { node: N.hov, name: 'state=Hover, error=False', force: ['hover'], element: field() },
  { node: N.foc, name: 'state=Focus, error=False', force: ['focus', 'focus-visible'], forceOn: '.rost-combobox__field', element: ring(field()) },
  { node: N.dis, name: 'state=Disabled, error=False', element: field(true) },
  // The help line sits under the field, outside its box, so it isn't in the picture.
  { node: N.edef, name: 'state=Default, error=True', element: field(false, true) },
  { node: N.ehov, name: 'state=Hover, error=True', force: ['hover'], element: field(false, true) },
  { node: N.efoc, name: 'state=Focus, error=True', force: ['focus', 'focus-visible'], forceOn: '.rost-combobox__field', element: ring(field(false, true)) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Combobox } from 'rost/components/combobox/Combobox'

<Combobox
  label="Client"
  options={clients.map((c) => ({ value: c.id, label: c.name }))}
  value={clientId}
  onValueChange={setClientId}
/>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', pointerEvents: 'none' }}>{field()}</span>
