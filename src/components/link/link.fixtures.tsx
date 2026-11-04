import { Link } from './Link'
import { Text } from '../text/Text'

// Figma's link set (705:81): each tone in each state, in body text. Quiet
// takes the colour around it, the secondary one here. The focus ring is drawn
// outside the link, so neither screenshot has it.
const FORCE = { Default: [], Hover: ['hover'], Pressed: ['active'], Focus: ['focus-visible'] } as const
const NODES = {
  accent: { Default: '705:63', Hover: '705:67', Pressed: '705:71', Focus: '705:75' },
  quiet: { Default: '705:65', Hover: '705:69', Pressed: '705:73', Focus: '705:78' },
} as const

export const fixtures = (['Default', 'Hover', 'Pressed', 'Focus'] as const).flatMap((state) => (['accent', 'quiet'] as const).map((tone) => ({
  node: NODES[tone][state], name: `tone=${tone}, state=${state}`,
  ...(FORCE[state].length ? { force: [...FORCE[state]], forceOn: '.rost-link' } : {}),
  element: <Text as="span" tone="secondary" style={{ display: 'inline-block' }}><Link href="/docs/contract/" tone={tone}>contract guide</Link></Text>,
})))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Link } from 'rost/components/link/Link'

<p>Read the <Link href="/docs/contract/">contract guide</Link> first.</p>
<Link href="https://github.com/Runceanu/rost" tone="quiet" external>GitHub</Link>`

/** What the component's card on rost.build shows. */
// The card is itself a link, and a link can't hold another, so the preview
// wears Link's classes on a span.
export const preview = <Text as="span" tone="secondary">A <span className="rost-link rost-link--tone-accent">link</span> in a sentence</Text>
