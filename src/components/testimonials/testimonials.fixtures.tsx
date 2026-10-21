import { Testimonials } from './Testimonials'

/**
 * One fixture per Figma variant, closed and open in each state, with Figma's
 * sample text and an empty picture slot, as in Figma. Hover and pressed are
 * forced on the block; focus on the header button, which is what takes it.
 * Figma's Focus frames include the ring, 4px outside.
 */
const NODES: [string, boolean, string][] = [
  ['Default', false, '144:68'], ['Default', true, '144:347'],
  ['Hover', false, '144:117'], ['Hover', true, '144:380'],
  ['Pressed', false, '144:92'], ['Pressed', true, '144:363'],
  ['Focus', false, '144:104'], ['Focus', true, '144:371'],
  ['Disabled', false, '144:80'], ['Disabled', true, '144:355'],
]
const FORCE: Record<string, string[]> = { Hover: ['hover'], Pressed: ['active'], Focus: ['focus', 'focus-visible'] }

export const fixtures = NODES.map(([state, expanded, node]) => {
  // Figma's open Default frame hugs its content: 976 plus the 16px indent.
  const width = state === 'Default' && expanded ? 992 : 976
  const el = <Testimonials expanded={expanded} disabled={state === 'Disabled'} style={{ width }} />
  return {
    node,
    name: `state=${state}, expanded=${expanded ? 'True' : 'False'}`,
    element: state === 'Focus' ? <div style={{ display: 'inline-flex', padding: 4 }}>{el}</div> : el,
    ...(FORCE[state] ? { force: FORCE[state] } : {}),
    ...(state === 'Focus' ? { forceOn: '.rost-testimonials__top' } : {}),
  }
})

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Testimonials } from 'rost/components/testimonials/Testimonials'

<Testimonials name="Client 1" jobDescription="Head of product" testimonial="He found the problem before we did.">
  <img src="/people/client-1.jpg" alt="" />
</Testimonials>`

/** What the component's card on rost.build shows: one, open. */
export const preview = (
  <span style={{ display: 'block', width: 420 * 0.62, height: 210 * 0.62 }}>
    <span style={{ display: 'block', width: 420, transform: 'scale(.62)', transformOrigin: 'top left' }}>
      <Testimonials expanded name="Client 1" jobDescription="Head of product" testimonial="He found the problem before we did." style={{ width: 420 }} />
    </span>
  </span>
)
