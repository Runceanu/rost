import { Menu } from '../components/menu/Menu'
import { PillButton } from '../components/pill-button/PillButton'

export const fixtures = []

/** What a caller writes. */
export const usage = `.nav {
  backdrop-filter: var(--effect-menu);
}`

/** What the effect's card on rost.build shows: a menu item on the glass, a button showing through from behind it, blurred. */
export const preview = (
  <span style={{ position: 'relative', display: 'block', width: 240, height: 104 }}>
    <span style={{ position: 'absolute', left: 0, top: 0 }}><PillButton as="span">Send invoice</PillButton></span>
    <span style={{
      position: 'absolute', left: 'var(--spacing-gap-xlarge)', right: 0, top: 'var(--spacing-gap-large)', bottom: 0,
      padding: '0 var(--spacing-gap-medium)', borderRadius: 'var(--spacing-radius-medium)', backdropFilter: 'var(--effect-menu)',
      border: 'var(--spacing-outline-small) solid var(--non-interactive-foreground-quinary)',
    }}>
      <Menu as="div" title="Work" description="Case studies" showDivider={false} style={{ width: '100%', paddingTop: 'var(--spacing-gap-medium)' }} />
    </span>
  </span>
)
