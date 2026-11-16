import { Stepper } from './Stepper'
import { Step } from '../step/Step'

// Figma's Stepper: three steps, on the second.
const sample = (
  <Stepper>
    <Step status="done" number={1}>Details</Step>
    <Step status="current" number={2}>Bank</Step>
    <Step status="upcoming" number={3}>Review</Step>
  </Stepper>
)
export const fixtures = [{ node: '744:31', name: 'stepper', element: <div style={{ width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Stepper } from 'rost/components/stepper/Stepper'
import { Step } from 'rost/components/step/Step'

<Stepper>
  <Step status="done" number={1}>Details</Step>
  <Step status="current" number={2}>Bank</Step>
  <Step number={3}>Review</Step>
</Stepper>`

/** What the component's card on rost.build shows. */
export const preview = sample
