import { Select } from './Select'

// One fixture per Figma variant, 208 wide like Input's. Hover is forced on
// the field, focus on the select itself.
const NODES = ['738:3', '738:9', '738:15', '738:22']
const field = (disabled = false) => (
  <Select label="Currency" defaultValue="eur" disabled={disabled} onChange={() => {}}>
    <option value="eur">Euro</option>
    <option value="ron">Romanian leu</option>
  </Select>
)
export const fixtures = [
  { node: NODES[0], name: 'state=Default', element: field() },
  { node: NODES[1], name: 'state=Hover', force: ['hover'], element: field() },
  { node: NODES[2], name: 'state=Focus', force: ['focus', 'focus-visible'], forceOn: '.rost-select__field', element: <div style={{ padding: 4, width: 'fit-content' }}>{field()}</div> },
  { node: NODES[3], name: 'state=Disabled', element: field(true) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Select } from 'rost/components/select/Select'

<Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
  <option value="eur">Euro</option>
  <option value="ron">Romanian leu</option>
</Select>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', pointerEvents: 'none' }}>{field()}</span>
