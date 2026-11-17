import { Calendar } from './Calendar'

// Figma's Calendar: November 2026, Monday first, today the 17th, the 20th picked.
const sample = <Calendar month={new Date(2026, 10, 1)} today={new Date(2026, 10, 17)} value={new Date(2026, 10, 20)} />
export const fixtures = [{ node: '750:34', name: 'calendar', element: <div style={{ display: 'flex', width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Calendar } from 'rost/components/calendar/Calendar'

<Calendar value={date} onValueChange={setDate} max={new Date()} />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ pointerEvents: 'none', display: 'inline-flex' }}>{sample}</span>
