import { PillButton } from '../components/pill-button/PillButton'

export const fixtures = []

/** What a caller writes. */
export const usage = `.panel {
  backdrop-filter: var(--effect-thumb);
  background: color-mix(in srgb, var(--base-black) calc(var(--opacity-medium) * 100%), transparent);
}`

/** What the effect's card on rost.build shows: a button with the frosted panel over its right half. */
export const preview = (
  <span style={{ position: 'relative', display: 'inline-flex' }}>
    <PillButton as="span">Send invoice</PillButton>
    <span style={{
      position: 'absolute', top: 'calc(-1 * var(--spacing-gap-small))', bottom: 'calc(-1 * var(--spacing-gap-small))', left: '50%', right: 'calc(-1 * var(--spacing-gap-large))',
      borderRadius: 'var(--spacing-radius-large)', backdropFilter: 'var(--effect-thumb)',
      background: 'color-mix(in srgb, var(--base-black) calc(var(--opacity-medium) * 100%), transparent)',
    }} />
  </span>
)
