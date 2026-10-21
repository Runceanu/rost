import { InlineBanner } from '../components/inline-banner/InlineBanner'

export const fixtures = []

/** What a caller writes. */
export const usage = `.popover {
  box-shadow: var(--shadow-floating);
}`

/** What the effect's card on rost.build shows: a banner lifted off the card. */
export const preview = (
  <span style={{ display: 'inline-flex', borderRadius: 'var(--spacing-radius-small)', boxShadow: 'var(--shadow-floating)' }}>
    <InlineBanner status="positive" size="medium">Saved just now</InlineBanner>
  </span>
)
