import { ListItem } from './ListItem'
import arrow from '../../../assets/icons/arrow-left.svg?url'
import chevron from '../../../assets/icons/chevron-right.svg?url'

/**
 * One fixture per Figma variant, with Figma's sample: an arrow, "Label" over
 * "Description", the status dot and a chevron. Hover, pressed and focus are
 * forced by the test.
 */
const icon = (src: string) => <span style={{ display: 'block', width: '100%', height: '100%', background: 'currentColor', mask: `url(${src}) center / contain no-repeat` }} />
const NODES: [selected: boolean, state: string, node: string][] = [
  [false, 'Default', '346:3367'], [true, 'Default', '346:3862'], [false, 'Disabled', '346:3759'], [true, 'Disabled', '346:3872'],
  [false, 'Pressed', '346:3725'], [true, 'Pressed', '346:3882'], [false, 'Focus', '346:3689'], [true, 'Focus', '346:3892'],
  [false, 'Hover', '346:3649'], [true, 'Hover', '346:3903'],
]
const FORCE: Record<string, string[]> = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] }

export const fixtures = NODES.map(([selected, state, node]) => ({
  node,
  name: `state=${state}, selected=${selected ? 'True' : 'False'}`,
  element: (
    <div style={{ width: 208 }}>
      <ListItem selected={selected} disabled={state === 'Disabled'} leading={icon(arrow)} description="Description" badge action={icon(chevron)}>Label</ListItem>
    </div>
  ),
  ...(FORCE[state] ? { force: FORCE[state] } : {}),
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { ListItem } from 'rost/components/list-item/ListItem'

<ListItem href="/invoices" selected aria-current="page" leading={<InvoiceIcon />}>Invoices</ListItem>
<ListItem href="/clients" description="12 active" badge action={<ChevronRight />}>Clients</ListItem>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'grid', gap: 4, width: 220 }}>
    <ListItem as="span" selected leading={icon(arrow)} description="12 this month">Invoices</ListItem>
    <ListItem as="span" leading={icon(arrow)} badge action={icon(chevron)}>Clients</ListItem>
  </span>
)
