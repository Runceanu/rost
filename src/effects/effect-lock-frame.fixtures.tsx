import { PillButton } from '../components/pill-button/PillButton'

export const fixtures = []

/** What a caller writes. */
export const usage = `.locked .thumb {
  filter: var(--effect-lock-frame);
}`

/** What the effect's card on rost.build shows: a real button, blurred the way a locked thumbnail is. */
export const preview = (
  <span style={{ display: 'block', filter: 'var(--effect-lock-frame)' }}>
    <PillButton tabIndex={-1}>Behind the lock</PillButton>
  </span>
)
