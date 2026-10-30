import { ToggleGroup } from './ToggleGroup'
import { Toggle } from '../toggle/Toggle'

// ToggleGroup started in code, not Figma, so there's no screenshot to
// compare: the Toggles inside are the ones Figma draws, and they're tested
// on their own.
const years = (on: number) => [2024, 2025, 2026].map((y) => <Toggle key={y} role="radio" selected={y === on}>{y}</Toggle>)

export const fixtures = [
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
