import { Divider } from './Divider'

/** Figma's only variant, at the width of its frame. */
export const fixtures = [
  { node: '39:111', name: 'divider', element: <div style={{ width: 104 }}><Divider /></div> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Divider } from 'rost/components/divider/Divider'

<Divider />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', width: 200 }}><Divider /></span>
