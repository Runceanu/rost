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
const frame = (el: JSX.Element, state: string) => <div style={{ display: 'inline-flex', padding: state === 'Focus' ? 4 : 0 }}>{el}</div>

export const fixtures = NODES.map(([state, selected, node]) => ({
  node,
  name: `state=${state}, selected=${selected ? 'True' : 'False'}`,
  element: frame(<Toggle selected={selected} aria-label="Previous year" disabled={state === 'Disabled'} />, state),
  ...(FORCE[state] ? { force: FORCE[state] } : {}),
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Toggle } from 'rost/components/toggle/Toggle'

<Toggle selected aria-label="Show archived" />

<div role="radiogroup" aria-label="Year">
  <Toggle role="radio" selected icon={<span>24</span>} aria-label="2024" />
  <Toggle role="radio" icon={<span>25</span>} aria-label="2025" />
</div>`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Toggle selected aria-label="On" tabIndex={-1} />
    <Toggle aria-label="Off" tabIndex={-1} />
  </span>
)
