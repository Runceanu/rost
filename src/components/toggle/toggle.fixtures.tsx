import type { JSX } from 'react'
import { Toggle } from './Toggle'

/**
 * One fixture per Figma variant, on and off in each state. Hover, pressed and
 * focus are forced by the test. Figma's Focus frames include the ring, 4px outside.
 */
const NODES: [string, boolean, string][] = [
  ['Default', true, '168:1150'], ['Default', false, '168:1152'],
  ['Hover', true, '168:1159'], ['Hover', false, '168:1161'],
  ['Pressed', true, '168:1170'], ['Pressed', false, '168:1172'],
  ['Disabled', true, '168:1181'], ['Disabled', false, '168:1183'],
  ['Focus', true, '168:1190'], ['Focus', false, '168:1193'],
]
const FORCE: Record<string, string[]> = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] }
const frame = (el: JSX.Element, state: string) => <div style={{ display: 'inline-flex', padding: state === 'Focus' ? 'var(--spacing-gap-2xsmall)' : 0 }}>{el}</div>

export const fixtures: { node: string; name: string; element: JSX.Element; force?: string[] }[] = NODES.map(([state, selected, node]) => ({
  node,
  name: `state=${state}, selected=${selected ? 'True' : 'False'}`,
  element: frame(<Toggle selected={selected} aria-label="Previous year" disabled={state === 'Disabled'} />, state),
  ...(FORCE[state] ? { force: FORCE[state] } : {}),
}))

// A labelled toggle isn't in Figma, so these have no screenshot to compare
// with: the visual test lists them and moves on. They show on the site.
fixtures.push(
  { node: 'labelled:off', name: 'labelled, off', element: <Toggle role="radio">2024</Toggle> },
  { node: 'labelled:on', name: 'labelled, on', element: <Toggle role="radio" selected>2026</Toggle> },
  { node: 'labelled:disabled', name: 'labelled, disabled', element: <Toggle role="radio" disabled>2023</Toggle> },
)

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Toggle } from 'rost/components/toggle/Toggle'

<Toggle selected aria-label="Show archived" />

<div role="radiogroup" aria-label="Tax year">
  <Toggle role="radio" selected>2025</Toggle>
  <Toggle role="radio">2026</Toggle>
</div>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span role="radiogroup" aria-label="Tax year" style={{ display: 'flex', gap: 'var(--spacing-gap-3xsmall)', alignItems: 'center' }}>
    <Toggle as="span">2024</Toggle>
    <Toggle as="span">2025</Toggle>
    <Toggle as="span" selected>2026</Toggle>
  </span>
)
