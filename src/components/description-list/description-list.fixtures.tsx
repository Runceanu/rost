import { DescriptionList } from './DescriptionList'

// Figma's DescriptionList: an invoice's details, 400 wide.
const items = [
  { term: 'Invoice', detail: '2026-014' },
  { term: 'Client', detail: 'Client One' },
  { term: 'Due', detail: '30 November 2026' },
]
export const fixtures = [{ node: '743:45', name: 'description-list', element: <div style={{ width: 400 }}><DescriptionList items={items} /></div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { DescriptionList } from 'rost/components/description-list/DescriptionList'

<DescriptionList items={[
  { term: 'Invoice', detail: '2026-014' },
  { term: 'Client', detail: 'Client One' },
]} />`

/** What the component's card on rost.build shows. */
export const preview = <div style={{ width: 220 }}><DescriptionList items={items.slice(0, 2)} /></div>
