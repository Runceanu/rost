import { Kbd } from './Kbd'

// Figma's Kbd: one key.
export const fixtures = [{ node: '742:25', name: 'kbd', element: <div style={{ display: 'flex', width: 'fit-content' }}><Kbd>Esc</Kbd></div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Kbd } from 'rost/components/kbd/Kbd'

Press <Kbd aria-label="Command">⌘</Kbd> + <Kbd>K</Kbd> to search.`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'flex', gap: 'var(--spacing-gap-2xsmall)', alignItems: 'center' }}><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
