import { Toolbar, ToolbarSeparator } from './Toolbar'
import { IconButton } from '../icon-button/IconButton'
import { Icon } from '../icon/Icon'

// Figma's Toolbar: a preview's tools, back and forward, then desktop and phone.
const sample = (
  <Toolbar label="Preview">
    <IconButton variant="tertiary" aria-label="Back" icon={<Icon name="arrow-left" size="small" />} />
    <IconButton variant="tertiary" aria-label="Forward" icon={<Icon name="arrow-right" size="small" />} />
    <ToolbarSeparator />
    <IconButton variant="tertiary" aria-label="Desktop" icon={<Icon name="desktop" size="small" />} />
    <IconButton variant="tertiary" aria-label="Phone" icon={<Icon name="mobile" size="small" />} />
  </Toolbar>
)
export const fixtures = [{ node: '746:135', name: 'toolbar', element: <div style={{ display: 'flex', width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Toolbar, ToolbarSeparator } from 'rost/components/toolbar/Toolbar'

<Toolbar label="Preview">
  <IconButton variant="tertiary" aria-label="Back" icon={<Icon name="arrow-left" size="small" />} onClick={back} />
  <IconButton variant="tertiary" aria-label="Forward" icon={<Icon name="arrow-right" size="small" />} onClick={forward} />
  <ToolbarSeparator />
  <IconButton variant="tertiary" aria-label="Desktop" icon={<Icon name="desktop" size="small" />} onClick={() => setView('desktop')} />
  <IconButton variant="tertiary" aria-label="Phone" icon={<Icon name="mobile" size="small" />} onClick={() => setView('phone')} />
</Toolbar>`

/** What the component's card on rost.build shows. */
export const preview = sample
