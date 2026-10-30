import { Projects } from './Projects'

/**
 * One fixture per Figma state, with Figma's sample text. Hover, pressed and
 * focus are forced by the test. Figma's Focus frame includes the ring, 4px outside.
 */
const row = (props = {}) => <Projects href="#" style={{ width: 976 }} {...props} />

export const fixtures = [
  { node: '100:184', name: 'state=Default', element: row() },
  { node: '100:180', name: 'state=Hover', element: row(), force: ['hover'] },
  { node: '100:182', name: 'state=Pressed', element: row(), force: ['active'] },
  { node: '100:181', name: 'state=Focus', element: <div style={{ display: 'inline-flex', padding: 'var(--spacing-gap-2xsmall)' }}>{row()}</div>, force: ['focus', 'focus-visible'] },
  { node: '100:183', name: 'state=Disabled', element: row({ disabled: true }) },
  { node: '238:140', name: 'state=Locked', element: row({ locked: true }) },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Projects } from 'rost/components/projects/Projects'

<Projects href="/work/accounting" number="01" name="Accounting app" industry="Finance" kind="Product" period="2025" />
<Projects locked number="02" name="Client 1" industry="Health" kind="Platform" period="2024" />`

/** What the component's card on rost.build shows: two rows, the second locked. The details are too small to read at card size, so they're off. */
const quiet = { showIndustry: false, showKind: false, showPeriod: false, style: { width: 480 } }
export const preview = (
  <span style={{ display: 'block', width: 480 * 0.55, height: 192 * 0.55 }}>
    <span style={{ display: 'block', width: 480, transform: 'scale(.55)', transformOrigin: 'top left' }}>
      <Projects as="div" number="01" name="Accounting app" {...quiet} />
      <Projects as="div" locked number="02" name="Client 1" {...quiet} />
    </span>
  </span>
)
