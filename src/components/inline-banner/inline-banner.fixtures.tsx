import { InlineBanner, type InlineBannerSize, type InlineBannerStatus } from './InlineBanner'

/**
 * One fixture per Figma variant, rendered by the visual test and compared with
 * the Figma screenshot of the same node. The label is Figma's own sample text.
 */
const VARIANTS: [InlineBannerStatus, InlineBannerSize, string][] = [
  ['default', 'small', '205:615'],
  ['negative', 'small', '205:722'],
  ['positive', 'small', '207:32'],
  ['warning', 'small', '207:48'],
  ['default', 'medium', '233:126'],
  ['negative', 'medium', '233:131'],
  ['positive', 'medium', '233:136'],
  ['warning', 'medium', '233:141'],
]

export const fixtures = VARIANTS.map(([status, size, node]) => ({
  node,
  name: `status=${status}, size=${size}`,
  element: <InlineBanner status={status} size={size}>label</InlineBanner>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { InlineBanner } from 'rost/components/inline-banner/InlineBanner'

<InlineBanner status="positive">Saved just now</InlineBanner>
<InlineBanner status="negative" size="small">Payment failed</InlineBanner>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gap-small)', alignItems: 'center' }}>
    <InlineBanner status="positive">Saved just now</InlineBanner>
    <InlineBanner status="warning" size="small">Due soon</InlineBanner>
  </span>
)
