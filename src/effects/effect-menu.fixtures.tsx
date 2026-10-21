import { PillButton } from '../components/pill-button/PillButton'

// The effect is one token, applied by whatever needs it. Shown here over real
// Rost components, so the blur has something to work on.
const frost = { backdropFilter: 'var(--effect-menu)', background: 'color-mix(in srgb, black calc(var(--opacity-medium) * 100%), transparent)' }

export const fixtures = []

/** What a caller writes. */
export const usage = `.panel {
  backdrop-filter: var(--effect-menu);
  background: color-mix(in srgb, black calc(var(--opacity-medium) * 100%), transparent);
}`

/** What the effect's card on rost.build shows: the nav's frosted glass over a button. */
export const preview = (
  <span style={{ position: 'relative', display: 'block', width: 240, height: 80 }}>
    <span style={{ position: 'absolute', left: 0, top: 0 }}><PillButton tabIndex={-1}>Behind the glass</PillButton></span>
    <span style={{ position: 'absolute', left: 88, top: 24, right: 0, bottom: 0, borderRadius: 'var(--spacing-radius-large)', ...frost }} />
  </span>
)
