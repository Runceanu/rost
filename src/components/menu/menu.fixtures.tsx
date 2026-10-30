import { Menu } from './Menu'

/**
 * One fixture per Figma state, with Figma's sample text. Hover, pressed and
 * focus are forced by the test. Figma's Focus frame is 4px wider each side, for the ring.
 */
const item = (props = {}) => <Menu href="#" style={{ width: 324 }} {...props} />

export const fixtures = [
  { node: '41:147', name: 'state=Default', element: item() },
  { node: '41:260', name: 'state=Hover', element: item(), force: ['hover'] },
  { node: '41:286', name: 'state=Pressed', element: item(), force: ['active'] },
  { node: '41:272', name: 'state=Focus', element: <div style={{ display: 'inline-flex', padding: '0 var(--spacing-gap-2xsmall)' }}>{item()}</div>, force: ['focus', 'focus-visible'] },
  { node: '41:298', name: 'state=Disabled', element: item({ disabled: true }) },
  // The page you're on, from aria-current="page". In Figma since 2026-10-30.
  // Figma draws the divider half a pixel either side of a zero-height line, so
  // its render shows the bright line at half strength in the frame's last row.
  // Divider is one solid pixel, so that row isn't compared.
  { node: '527:586', name: 'state=Current', element: item({ 'aria-current': 'page' }), mask: [{ x: 0, y: 102, width: 324, height: 1 }] },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Menu } from 'rost/components/menu/Menu'

<nav aria-label="Main">
  <Menu href="/work" title="Work" description="Products and case studies" aria-current="page" />
  <Menu href="/about" title="About" description="Who I am" />
</nav>`

/** What the component's card on rost.build shows. */
export const preview = <Menu as="div" title="Work" description="Products and case studies" aria-current="page" style={{ width: 220 }} />
