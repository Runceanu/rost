import { Link } from './Link'
import { Text } from '../text/Text'

const line = (link: React.ReactNode) => <Text tone="secondary">Read the {link} first.</Text>

export const fixtures = [
  { node: 'link:accent', name: 'tone=accent', element: line(<Link href="/docs/contract/">contract guide</Link>) },
  { node: 'link:accent-hover', name: 'tone=accent, state=Hover', force: ['hover'], element: line(<Link href="/docs/contract/">contract guide</Link>) },
  { node: 'link:accent-focus', name: 'tone=accent, state=Focus', force: ['focus-visible'], element: line(<Link href="/docs/contract/">contract guide</Link>) },
  { node: 'link:quiet', name: 'tone=quiet', element: line(<Link href="/docs/contract/" tone="quiet">contract guide</Link>) },
  { node: 'link:quiet-hover', name: 'tone=quiet, state=Hover', force: ['hover'], element: line(<Link href="/docs/contract/" tone="quiet">contract guide</Link>) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Link } from 'rost/components/link/Link'

<p>Read the <Link href="/docs/contract/">contract guide</Link> first.</p>
<Link href="https://github.com/Runceanu/rost" tone="quiet" external>GitHub</Link>`

/** What the component's card on rost.build shows. */
// The card is itself a link, and a link can't hold another, so the preview
// wears Link's classes on a span.
export const preview = <Text as="span" tone="secondary">A <span className="rost-link rost-link--tone-accent">link</span> in a sentence</Text>
