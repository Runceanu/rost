import { Accordion } from './Accordion'
import { Text } from '../text/Text'

// Figma's Accordion: three questions, all closed, 400 wide.
const items = ['What counts as an expense?', 'When is tax due?', 'Can I export my data?'].map((summary) => ({
  summary,
  content: <Text variant="paragraph" tone="secondary">The short answer, in a sentence or two.</Text>,
}))
export const fixtures = [{ node: '745:29', name: 'accordion', element: <div style={{ width: 400 }}><Accordion items={items} /></div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Accordion } from 'rost/components/accordion/Accordion'

<Accordion items={[
  { summary: 'When is tax due?', content: <Text>By 25 May for the year before.</Text> },
]} />`

/** What the component's card on rost.build shows. */
export const preview = <div style={{ width: 220 }}><Accordion items={items.slice(0, 2)} /></div>
