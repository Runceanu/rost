import { Legend } from './Legend'

// Figma's Legend: BarChart's two colours, with this month's total, 222 wide
// like the drawing (a Legend fills its line; Figma rounds each text up a pixel).
const sample = <Legend items={[{ label: 'Earlier months' }, { label: 'November', value: '€2,760', current: true }]} />
export const fixtures = [{ node: '753:25', name: 'legend', element: <div style={{ width: 222 }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Legend } from 'rost/components/legend/Legend'

<Legend items={[{ label: 'Earlier months' }, { label: 'November', value: '€2,760', current: true }]} />`

/** What the component's card on rost.build shows. */
export const preview = sample
