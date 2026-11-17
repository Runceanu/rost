import { ComboboxOption } from './ComboboxOption'

// One fixture per Figma variant, 200 wide (a 208px list less its 4px each side).
type V = [selected: boolean, active: boolean, node: string]
const VARIANTS: V[] = [[false, false, '756:60'], [false, true, '756:62'], [true, false, '756:64'], [true, true, '756:68']]
export const fixtures = VARIANTS.map(([selected, active, node]) => ({
  node,
  name: `selected=${selected ? 'True' : 'False'}, active=${active ? 'True' : 'False'}`,
  element: <div role="listbox" aria-label="Client" style={{ width: 200 }}><ComboboxOption selected={selected} active={active}>Client One</ComboboxOption></div>,
}))
