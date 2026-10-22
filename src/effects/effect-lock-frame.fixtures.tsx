import { PillButton } from '../components/pill-button/PillButton'
import iconLock from '../components/thumbs/icon-lock.svg?url'

export const fixtures = []

/** What a caller writes. */
export const usage = `.locked .thumb {
  filter: var(--effect-lock-frame);
}`

/** What the effect's card on rost.build shows: a button blurred by the effect, with the lock on top, as on a locked project. */
export const preview = (
  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ display: 'inline-flex', filter: 'var(--effect-lock-frame)' }}><PillButton as="span">Send invoice</PillButton></span>
    <span style={{ position: 'absolute', display: 'flex', padding: 'var(--spacing-gap-small)', borderRadius: 'var(--spacing-radius-medium)', background: 'var(--non-interactive-background-positive-base)' }}>
      <span role="img" aria-label="Locked" style={{
        display: 'block', width: 'var(--spacing-size-small)', height: 'var(--spacing-size-small)', background: 'var(--non-interactive-foreground-contrast)',
        mask: `url(${iconLock}) center / contain no-repeat`, WebkitMask: `url(${iconLock}) center / contain no-repeat`,
      }} />
    </span>
  </span>
)
