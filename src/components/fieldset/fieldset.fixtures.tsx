import { Fieldset } from './Fieldset'
import { Radio } from '../radio/Radio'

// Figma's Fieldset: a question with two Radios and help.
const sample = (
  <Fieldset legend="How often do you invoice?" help="You can change this later in Settings.">
    <Radio name="fieldset-often" checked onChange={() => {}}>Every month</Radio>
    <Radio name="fieldset-often" checked={false} onChange={() => {}}>Every quarter</Radio>
  </Fieldset>
)
export const fixtures = [{ node: '745:6', name: 'fieldset', element: <div style={{ width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Fieldset } from 'rost/components/fieldset/Fieldset'

<Fieldset legend="How often do you invoice?" help="You can change this later in Settings.">
  <Radio name="often" value="month" defaultChecked>Every month</Radio>
  <Radio name="often" value="quarter">Every quarter</Radio>
</Fieldset>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ pointerEvents: 'none' }}>{sample}</span>
