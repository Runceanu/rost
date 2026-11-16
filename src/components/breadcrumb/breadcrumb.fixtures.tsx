import { Breadcrumb } from './Breadcrumb'

// Figma's Breadcrumb: three levels down.
const items = [{ label: 'Clients', href: '#clients' }, { label: 'Client One', href: '#client' }, { label: 'Invoice 2026-014' }]
export const fixtures = [{ node: '742:29', name: 'breadcrumb', element: <div style={{ width: 'fit-content' }}><Breadcrumb items={items} /></div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Breadcrumb } from 'rost/components/breadcrumb/Breadcrumb'

<Breadcrumb items={[
  { label: 'Clients', href: '/clients' },
  { label: 'Client One', href: '/clients/1' },
  { label: 'Invoice 2026-014' },
]} />`

/** What the component's card on rost.build shows. */
export const preview = <Breadcrumb items={items} />
