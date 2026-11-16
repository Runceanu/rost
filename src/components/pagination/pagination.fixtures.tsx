import { Pagination } from './Pagination'

// Figma's Pagination: the middle of a long list, so both buttons are live.
export const fixtures = [{ node: '742:43', name: 'pagination', element: <Pagination page={3} pages={12} /> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Pagination } from 'rost/components/pagination/Pagination'

<Pagination page={page} pages={pages} onChange={setPage} />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ pointerEvents: 'none' }}><Pagination page={3} pages={12} /></span>
