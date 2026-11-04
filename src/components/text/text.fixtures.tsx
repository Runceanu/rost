import { Text, type TextVariant } from './Text'

// Figma's text set (705:29): one variant per step of the ramp. Each is drawn
// at the width of its words, so the test shows it inline-block.
const sample: [TextVariant, string, string, string][] = [
  ['display', 'h1', 'Rost', '705:13'],
  ['headline', 'h2', 'Components', '705:15'],
  ['sub-headline', 'h2', 'Values', '705:17'],
  ['lede', 'p', 'Where things belong.', '705:19'],
  ['body', 'p', 'Every value comes from a token.', '705:21'],
  ['paragraph', 'p', 'Every value comes from a token.', '705:23'],
  ['label', 'span', 'Token coverage', '705:25'],
  ['eyebrow', 'span', 'Components', '705:27'],
]

export const fixtures = sample.map(([variant, as, words, node]) => ({
  node, name: `variant=${variant}`,
  // The eyebrow brings its own quiet colour; the rest are in the primary one, as in Figma.
  element: <Text variant={variant} as={as} tone={variant === 'eyebrow' ? undefined : 'primary'} style={{ display: 'inline-block' }}>{words}</Text>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Text } from 'rost/components/text/Text'

<Text variant="eyebrow" as="span">Foundations</Text>
<Text variant="display" as="h1">Tokens</Text>
<Text variant="lede">Every value comes from one of these.</Text>
<Text tone="secondary">The names are the CSS variables.</Text>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'grid', gap: 4 }}><Text variant="eyebrow" as="span">Foundations</Text><Text variant="sub-headline" as="span" tone="primary">Type</Text></span>
