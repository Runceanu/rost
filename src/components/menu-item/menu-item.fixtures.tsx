import { MenuItem } from './MenuItem'

// One fixture per Figma variant, 172 wide (a 180px menu less its 4px each
// side). Hover is forced on the item.
type V = [tone: 'default' | 'negative', state: 'Default' | 'Hover' | 'Disabled', node: string, words: string]
const VARIANTS: V[] = [
  ['default', 'Default', '755:13', 'Duplicate'], ['default', 'Hover', '755:15', 'Duplicate'], ['default', 'Disabled', '755:17', 'Duplicate'],
  ['negative', 'Default', '755:19', 'Delete'], ['negative', 'Hover', '755:21', 'Delete'],
]
export const fixtures = VARIANTS.map(([tone, state, node, words]) => ({
  node,
  name: `tone=${tone}, state=${state}`,
  element: <div role="menu" style={{ width: 172 }}><MenuItem tone={tone} disabled={state === 'Disabled'}>{words}</MenuItem></div>,
  ...(state === 'Hover' ? { force: ['hover'], forceOn: '.rost-menu-item' } : {}),
}))
