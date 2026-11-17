import { Timeline } from './Timeline'
import { TimelineItem } from '../timeline-item/TimelineItem'

// Figma's Timeline: an invoice's history, newest first.
const sample = (
  <Timeline aria-label="Invoice history">
    <TimelineItem current title="Paid" time="14 Nov, 09:12">Client 1 paid by bank transfer.</TimelineItem>
    <TimelineItem title="Opened" time="12 Nov, 16:40" />
    <TimelineItem title="Sent to Client 1" time="10 Nov, 11:05" />
  </Timeline>
)
export const fixtures = [{ node: '746:64', name: 'timeline', element: <div style={{ width: 320 }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Timeline } from 'rost/components/timeline/Timeline'
import { TimelineItem } from 'rost/components/timeline-item/TimelineItem'

<Timeline aria-label="Invoice history">
  <TimelineItem current title="Paid" time="14 Nov, 09:12" dateTime="2026-11-14T09:12">
    Client 1 paid by bank transfer.
  </TimelineItem>
  <TimelineItem title="Opened" time="12 Nov, 16:40" dateTime="2026-11-12T16:40" />
  <TimelineItem title="Sent to Client 1" time="10 Nov, 11:05" dateTime="2026-11-10T11:05" />
</Timeline>`

/** What the component's card on rost.build shows. */
export const preview = sample
