import { Icon } from './Icon'

/** Figma draws its icons in `non-interactive/foreground/tertiary`; an Icon takes the colour it's in. */
const tint = { display: 'inline-flex', color: 'var(--non-interactive-foreground-tertiary)' }

/** One fixture per icon in Figma's set. `circle-outline` has no frame there. */
export const fixtures = [
  { node: '93:461', name: 'icons/arrow-down', element: <span style={tint}><Icon name="arrow-down" /></span> },
  { node: '93:786', name: 'icons/arrow-down-left', element: <span style={tint}><Icon name="arrow-down-left" /></span> },
  { node: '93:462', name: 'icons/arrow-left', element: <span style={tint}><Icon name="arrow-left" /></span> },
  { node: '93:464', name: 'icons/arrow-right', element: <span style={tint}><Icon name="arrow-right" /></span> },
  { node: '93:460', name: 'icons/arrow-up', element: <span style={tint}><Icon name="arrow-up" /></span> },
  { node: '93:458', name: 'icons/chevron-down', element: <span style={tint}><Icon name="chevron-down" /></span> },
  { node: '93:463', name: 'icons/chevron-left', element: <span style={tint}><Icon name="chevron-left" /></span> },
  { node: '93:459', name: 'icons/chevron-right', element: <span style={tint}><Icon name="chevron-right" /></span> },
  { node: '93:457', name: 'icons/chevron-up', element: <span style={tint}><Icon name="chevron-up" /></span> },
  { node: '168:1333', name: 'icons/desktop', element: <span style={tint}><Icon name="desktop" /></span> },
  { node: '93:718', name: 'icons/dot', element: <span style={tint}><Icon name="dot" /></span> },
  { node: '93:782', name: 'icons/down-right', element: <span style={tint}><Icon name="down-right" /></span> },
  { node: '201:13', name: 'icons/drag', element: <span style={tint}><Icon name="drag" /></span> },
  { node: '168:1334', name: 'icons/mobile', element: <span style={tint}><Icon name="mobile" /></span> },
  { node: '136:68', name: 'icons/scroll', element: <span style={tint}><Icon name="scroll" /></span> },
  { node: '93:784', name: 'icons/up-left', element: <span style={tint}><Icon name="up-left" /></span> },
  { node: '93:780', name: 'icons/up-right', element: <span style={tint}><Icon name="up-right" /></span> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Icon } from 'rost/components/icon/Icon'

<Icon name="arrow-right" />
<Icon name="chevron-down" size="small" />
<Icon name="drag" label="Reorder" />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'inline-flex', gap: 'var(--spacing-gap-medium)', color: 'var(--non-interactive-foreground-secondary)' }}>{(['arrow-left', 'chevron-down', 'up-right', 'drag'] as const).map((n) => <Icon key={n} name={n} />)}</span>
