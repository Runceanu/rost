import { Disclosure } from './Disclosure'
import { Text } from '../text/Text'

const body = <Text variant="paragraph" tone="secondary">The whole file, for the few who want it.</Text>

// Figma's disclosure set (705:142). Drawn at its own width, so the test shows
// it inline-block, in paragraph text so the line is 20px like the summary.
const box = (d: React.ReactNode) => <Text variant="paragraph" as="div" style={{ display: 'inline-block' }}>{d}</Text>

export const fixtures = [
  { node: '705:116', name: 'state=Default', element: box(<Disclosure summary="The SVG">{body}</Disclosure>) },
  { node: '705:122', name: 'state=Hover', force: ['hover'], forceOn: '.rost-disclosure__summary', element: box(<Disclosure summary="The SVG">{body}</Disclosure>) },
  { node: '705:128', name: 'state=Focus', force: ['focus-visible'], forceOn: '.rost-disclosure__summary', element: box(<Disclosure summary="The SVG">{body}</Disclosure>) },
  { node: '705:135', name: 'state=Open', element: box(<Disclosure summary="The SVG" open>{body}</Disclosure>) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Disclosure } from 'rost/components/disclosure/Disclosure'

<Disclosure summary="The SVG">
  <Code block>{svg}</Code>
</Disclosure>`

/** What the component's card on rost.build shows. */
export const preview = <Disclosure summary="The SVG" open><Text variant="paragraph" as="span" tone="secondary">Out of the way until you want it.</Text></Disclosure>
