import { Navigation } from './Navigation'
import { ListItem } from '../list-item/ListItem'
import { IconButton } from '../icon-button/IconButton'
import { Button } from '../button/Button'
import circle from '../../../assets/icons/circle-outline.svg?url'
import logo from '../../../assets/brand/logo.svg?url'

/**
 * Figma's two variants, with its samples: the logo, three items with the
 * circle icon, and a Secondary action. 408px tall, as Figma draws them.
 */
const icon = <span style={{ display: 'block', width: '100%', height: '100%', background: 'currentColor', mask: `url(${circle}) center / contain no-repeat` }} />
const mark = <img src={logo} alt="" width={40} height={40} style={{ display: 'block' }} />

const collapsed = (
  <div style={{ width: 72, height: 408 }}>
    <Navigation collapsed aria-label="Main" logo={mark} action={<IconButton variant="secondary" aria-label="Action" icon={icon} />}>
      <ListItem href="#" aria-label="Label" leading={icon} />
      <ListItem href="#" aria-label="Label" leading={icon} />
      <ListItem href="#" aria-label="Label" leading={icon} />
    </Navigation>
  </div>
)
const open = (
  <div style={{ width: 160, height: 408 }}>
    <Navigation aria-label="Main" logo={mark} action={<Button variant="secondary" style={{ width: '100%' }}>label</Button>}>
      <ListItem href="#" leading={icon}>Label</ListItem>
      <ListItem href="#" leading={icon}>Label</ListItem>
      <ListItem href="#" leading={icon}>Label</ListItem>
    </Navigation>
  </div>
)

export const fixtures = [
  { node: '356:948', name: 'collapsed=true', element: collapsed },
  { node: '356:947', name: 'collapsed=false', element: open },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Navigation } from 'rost/components/navigation/Navigation'
import { ListItem } from 'rost/components/list-item/ListItem'
import { Button } from 'rost/components/button/Button'

<Navigation aria-label="Main" logo={<Logo />} action={<Button variant="secondary">New invoice</Button>}>
  <ListItem href="/" selected aria-current="page" leading={<HomeIcon />}>Home</ListItem>
  <ListItem href="/invoices" leading={<InvoiceIcon />}>Invoices</ListItem>
</Navigation>`

/** What the component's card on rost.build shows: drawn without links, since the card is one. */
export const preview = (
  <span style={{ display: 'flex', gap: 16, height: 150 }}>
    <span style={{ width: 72, display: 'block' }}>
      <span className="rost-navigation rost-navigation--collapsed" style={{ display: 'flex' }}>
        <span className="rost-navigation__background" />
        <span className="rost-navigation__logo">{mark}</span>
        <span className="rost-navigation__main"><ListItem as="span" selected leading={icon} /></span>
      </span>
    </span>
    <span style={{ width: 160, display: 'block' }}>
      <span className="rost-navigation" style={{ display: 'flex' }}>
        <span className="rost-navigation__background" />
        <span className="rost-navigation__logo">{mark}</span>
        <span className="rost-navigation__main"><ListItem as="span" selected leading={icon}>Home</ListItem></span>
      </span>
    </span>
  </span>
)
