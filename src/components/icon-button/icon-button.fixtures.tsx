import type { JSX } from 'react'
import { IconButton, type IconButtonVariant } from './IconButton'

/**
 * One fixture per Figma variant, with Figma's arrow. Hover, pressed and focus
 * are forced by the test. Figma's Focus frames include the ring, 4px outside.
 */
const NODES: Record<IconButtonVariant, Record<string, string>> = {
  primary: { Default: '93:588', Hover: '93:601', Pressed: '93:616', Disabled: '93:631', Focus: '93:644' },
  secondary: { Default: '93:591', Hover: '93:604', Pressed: '93:619', Disabled: '93:634', Focus: '93:648' },
  tertiary: { Default: '93:595', Hover: '93:608', Pressed: '93:623', Disabled: '93:638', Focus: '93:653' },
  project: { Default: '93:740', Hover: '93:742', Pressed: '93:745', Disabled: '93:748', Focus: '93:750' },
}
const FORCE: Record<string, string[]> = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] }
const frame = (el: JSX.Element, state: string) => <div style={{ display: 'inline-flex', padding: state === 'Focus' ? 'var(--spacing-gap-2xsmall)' : 0 }}>{el}</div>
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

export const fixtures = Object.entries(NODES).flatMap(([type, states]) =>
  Object.entries(states).map(([state, node]) => ({
    node,
    name: `type=${cap(type)}, state=${state}`,
    element: frame(<IconButton variant={type as IconButtonVariant} aria-label="Back" disabled={state === 'Disabled'} />, state),
    ...(FORCE[state] ? { force: FORCE[state] } : {}),
  })),
)

/** What a caller writes. Shown on the component's page. */
export const usage = `import { IconButton } from 'rost/components/icon-button/IconButton'

<IconButton aria-label="Back" />
<IconButton variant="secondary" aria-label="Previous project" />`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 'var(--spacing-gap-small-medium)', alignItems: 'center' }}>
    <IconButton as="span" aria-label="Back" />
    <IconButton as="span" variant="secondary" aria-label="Back" />
    <IconButton as="span" variant="tertiary" aria-label="Back" />
  </span>
)
