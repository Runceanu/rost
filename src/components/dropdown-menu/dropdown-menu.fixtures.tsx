import { DropdownMenu, MenuSeparator } from './DropdownMenu'
import { MenuItem } from '../menu-item/MenuItem'

// Figma's DropdownMenu: the plate drawn in place, an invoice's actions.
const items = (
  <>
    <MenuItem>Edit</MenuItem>
    <MenuItem>Duplicate</MenuItem>
    <MenuItem disabled>Send reminder</MenuItem>
    <MenuSeparator />
    <MenuItem tone="negative">Delete</MenuItem>
  </>
)
const sample = <DropdownMenu preview label="Invoice actions" trigger={<span />}>{items}</DropdownMenu>
export const fixtures = [{ node: '755:25', name: 'dropdown-menu', element: <div style={{ width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { DropdownMenu, MenuSeparator } from 'rost/components/dropdown-menu/DropdownMenu'
import { MenuItem } from 'rost/components/menu-item/MenuItem'

<DropdownMenu
  label="Invoice actions"
  trigger={<IconButton variant="tertiary" aria-label="More" icon={<Icon name="chevron-down" size="small" />} />}
>
  <MenuItem onClick={edit}>Edit</MenuItem>
  <MenuItem onClick={duplicate}>Duplicate</MenuItem>
  <MenuSeparator />
  <MenuItem tone="negative" onClick={remove}>Delete</MenuItem>
</DropdownMenu>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ pointerEvents: 'none' }}>{sample}</span>

