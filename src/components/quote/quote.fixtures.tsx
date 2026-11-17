import { Quote } from './Quote'

// Figma's Quote: two lines of words and who said them, 400px wide.
const sample = <Quote cite="Client 2, finance lead">We stopped chasing invoices. The reminders do it, and they sound like us.</Quote>
export const fixtures = [{ node: '748:37', name: 'quote', element: <div style={{ width: 400 }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Quote } from 'rost/components/quote/Quote'

<Quote cite="Client 2, finance lead">
  We stopped chasing invoices. The reminders do it, and they sound like us.
</Quote>`

/** What the component's card on rost.build shows. */
export const preview = <div style={{ width: 280 }}>{sample}</div>
