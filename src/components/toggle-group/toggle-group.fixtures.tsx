import { ToggleGroup } from './ToggleGroup'
import { Toggle } from '../toggle/Toggle'

// Figma's ToggleGroup (since 2026-10-30) holds three of its icon Toggles,
// the middle one on, since Figma's Toggle has no label. The year rows are
// what the accounting app draws; there's no Figma frame for those.
const years = (on: number) => [2024, 2025, 2026].map((y) => <Toggle key={y} role="radio" selected={y === on}>{y}</Toggle>)

const icons = (on: number) => [0, 1, 2].map((i) => <Toggle key={i} role="radio" selected={i === on} aria-label={`Option ${i + 1}`} />)

export const fixtures = [
  { node: '528:742', name: 'toggle-group', element: <ToggleGroup label="Example">{icons(1)}</ToggleGroup> },
  { node: 'group:years', name: 'years, 2026 chosen', element: <ToggleGroup label="Tax year">{years(2026)}</ToggleGroup> },
  { node: 'group:disabled', name: 'one option disabled', element: <ToggleGroup label="Tax year"><Toggle role="radio" disabled>2023</Toggle>{years(2025)}</ToggleGroup> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { ToggleGroup } from 'rost/components/toggle-group/ToggleGroup'
import { Toggle } from 'rost/components/toggle/Toggle'

<ToggleGroup label="Tax year">
  {years.map((y) => (
    <Toggle key={y} role="radio" selected={y === year} onClick={() => setYear(y)}>
      {y}
    </Toggle>
  ))}
</ToggleGroup>`

/** What the component's card on rost.build shows. */
export const preview = <ToggleGroup label="Tax year">{years(2026)}</ToggleGroup>
