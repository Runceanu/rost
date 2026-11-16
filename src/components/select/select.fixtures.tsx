import { Select } from './Select'

// One fixture per Figma variant, 208 wide like Input's. Hover is forced on
// the field, focus on the select itself.
const NODES = ['738:3', '738:9', '738:15', '738:22', '741:35', '741:42', '741:49']
const field = (disabled = false, error = false) => (
  <Select label="Currency" defaultValue="eur" disabled={disabled} error={error} supportive={error ? 'Invoices in this currency need a bank account' : undefined} onChange={() => {}}>
    <option value="eur">Euro</option>
    <option value="ron">Romanian leu</option>
  </Select>
)
export const fixtures = [
  { node: NODES[0], name: 'state=Default, error=False', element: field() },
  { node: NODES[1], name: 'state=Hover, error=False', force: ['hover'], element: field() },
  { node: NODES[2], name: 'state=Focus, error=False', force: ['focus', 'focus-visible'], forceOn: '.rost-select__field', element: <div style={{ padding: 4, width: 'fit-content' }}>{field()}</div> },
  { node: NODES[3], name: 'state=Disabled, error=False', element: field(true) },
  // The help line sits under the field, outside its box, so it isn't in the picture.
  { node: NODES[4], name: 'state=Default, error=True', element: field(false, true) },
  { node: NODES[5], name: 'state=Hover, error=True', force: ['hover'], element: field(false, true) },
  { node: NODES[6], name: 'state=Focus, error=True', force: ['focus', 'focus-visible'], forceOn: '.rost-select__field', element: <div style={{ padding: 4, width: 'fit-content' }}>{field(false, true)}</div> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Select } from 'rost/components/select/Select'

<Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
  <option value="eur">Euro</option>
  <option value="ron">Romanian leu</option>
</Select>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', pointerEvents: 'none' }}>{field()}</span>
