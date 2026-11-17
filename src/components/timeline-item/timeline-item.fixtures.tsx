import { TimelineItem } from './TimelineItem'

// One fixture per Figma variant, in an <ol> as a TimelineItem always is.
type V = [current: boolean, last: boolean, node: string]
const VARIANTS: V[] = [[false, false, '746:30'], [true, false, '746:38'], [false, true, '746:46'], [true, true, '746:54']]
export const fixtures = VARIANTS.map(([current, last, node]) => ({
  node,
  name: `current=${current ? 'True' : 'False'}, last=${last ? 'True' : 'False'}`,
  element: (
    <ol style={{ width: 240, margin: 0, padding: 0, listStyle: 'none' }}>
      <TimelineItem current={current} last={last} title="Sent to Client 1" time="10 Nov, 11:05" />
    </ol>
  ),
}))
