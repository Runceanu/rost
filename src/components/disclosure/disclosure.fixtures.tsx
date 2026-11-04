import { Disclosure } from './Disclosure'
import { Text } from '../text/Text'

const body = <Text variant="paragraph" tone="secondary">The whole file, for the few who want it.</Text>

export const fixtures = [
  { node: 'disclosure:closed', name: 'state=Default', element: <Disclosure summary="The SVG">{body}</Disclosure> },
  { node: 'disclosure:hover', name: 'state=Hover', force: ['hover'], forceOn: '.rost-disclosure__summary', element: <Disclosure summary="The SVG">{body}</Disclosure> },
  { node: 'disclosure:open', name: 'state=Open', element: <Disclosure summary="The SVG" open>{body}</Disclosure> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Disclosure } from 'rost/components/disclosure/Disclosure'

<Disclosure summary="The SVG">
  <Code block>{svg}</Code>
</Disclosure>`

/** What the component's card on rost.build shows. */
export const preview = <Disclosure summary="The SVG" open><Text variant="paragraph" as="span" tone="secondary">Out of the way until you want it.</Text></Disclosure>
