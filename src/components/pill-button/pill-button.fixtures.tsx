import type { JSX } from 'react'
import { PillButton, type PillButtonType } from './PillButton'

/**
 * One fixture per Figma variant, with Figma's sample label. Hover, pressed
 * and focus are forced by the test. Figma's Focus frames include the ring,
 * 4px outside, so those sit in a 4px frame here too.
 */
const NODES: Record<PillButtonType, Record<string, string>> = {
  primary: { Default: '20:13', Hover: '20:15', Pressed: '20:20', Disabled: '20:22', Focus: '20:17' },
  secondary: { Default: '25:80', Hover: '25:82', Pressed: '25:84', Disabled: '25:86', Focus: '25:88' },
  tertiary: { Default: '25:191', Hover: '25:194', Pressed: '25:197', Disabled: '25:200', Focus: '25:203' },
  borderless: { Default: '25:249', Hover: '25:251', Pressed: '25:254', Disabled: '25:257', Focus: '25:260' },
}
const FORCE: Record<string, string[]> = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] }
const frame = (el: JSX.Element, state: string) => <div style={{ display: 'inline-flex', padding: state === 'Focus' ? 'var(--spacing-gap-2xsmall)' : 0 }}>{el}</div>
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

export const fixtures = Object.entries(NODES).flatMap(([type, states]) =>
  Object.entries(states).map(([state, node]) => ({
    node,
    name: `type=${cap(type)}, state=${state}`,
    element: frame(<PillButton type={type as PillButtonType} disabled={state === 'Disabled'}>label</PillButton>, state),
    ...(FORCE[state] ? { force: FORCE[state] } : {}),
  })),
)

/** What a caller writes. Shown on the component's page. */
export const usage = `import { PillButton } from 'rost/components/pill-button/PillButton'

<PillButton>Get in touch</PillButton>
<PillButton type="secondary" href="/work">See the work</PillButton>
<PillButton type="tertiary">Cancel</PillButton>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 'var(--spacing-gap-small)' }}>
    <PillButton tabIndex={-1}>Get in touch</PillButton>
    <PillButton type="secondary" tabIndex={-1}>The work</PillButton>
  </span>
)
