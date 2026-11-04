import { Text, type TextVariant } from './Text'

const sample: [TextVariant, string, string][] = [
  ['display', 'h1', 'Rost'],
  ['headline', 'h2', 'Components'],
  ['sub-headline', 'h2', 'Values'],
  ['lede', 'p', 'Where things belong.'],
  ['body', 'p', 'Every value comes from a token.'],
  ['paragraph', 'p', 'Every value comes from a token.'],
  ['label', 'span', 'Every value comes from a token.'],
  ['eyebrow', 'span', 'Foundations'],
]

export const fixtures = sample.map(([variant, as, words]) => ({
  node: `text:${variant}`, name: `variant=${variant}`,
  element: <Text variant={variant} as={as} tone="primary">{words}</Text>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Text } from 'rost/components/text/Text'

<Text variant="eyebrow" as="span">Foundations</Text>
<Text variant="display" as="h1">Tokens</Text>
<Text variant="lede">Every value comes from one of these.</Text>
<Text tone="secondary">The names are the CSS variables.</Text>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'grid', gap: 4 }}><Text variant="eyebrow" as="span">Foundations</Text><Text variant="sub-headline" as="span" tone="primary">Type</Text></span>
