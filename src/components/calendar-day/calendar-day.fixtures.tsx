import { CalendarDay, type CalendarDayStatus } from './CalendarDay'

// One fixture per Figma variant, each the number 17. Hover and focus are forced.
type V = [status: CalendarDayStatus, state: 'Default' | 'Hover' | 'Focus', node: string]
const VARIANTS: V[] = [
  ['default', 'Default', '750:14'], ['default', 'Hover', '750:16'], ['default', 'Focus', '750:18'],
  ['outside', 'Default', '750:20'], ['outside', 'Hover', '750:22'],
  ['today', 'Default', '750:24'], ['today', 'Hover', '750:26'],
  ['selected', 'Default', '750:28'], ['disabled', 'Default', '750:30'],
]
const FORCE = { Default: [], Hover: ['hover'], Focus: ['focus', 'focus-visible'] } as Record<string, string[]>
export const fixtures = VARIANTS.map(([status, state, node]) => ({
  node,
  name: `status=${status}, state=${state}`,
  element: <div style={{ display: 'flex', width: 'fit-content' }}><CalendarDay status={status} aria-label="November 17, 2026">17</CalendarDay></div>,
  ...(FORCE[state].length ? { force: FORCE[state], forceOn: '.rost-calendar-day' } : {}),
}))
