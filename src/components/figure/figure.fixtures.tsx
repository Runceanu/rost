import { Figure } from './Figure'
import { Illustration } from '../illustration/Illustration'

// Figma's Figure: one of Rost's drawings on a 320 by 180 plate, with a caption.
const sample = (
  <Figure caption="Every component starts as a contract, then becomes code and a drawing.">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 320, height: 180 }}><Illustration name="design-system" /></div>
  </Figure>
)
export const fixtures = [{ node: '748:28', name: 'figure', element: <div style={{ width: 320 }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Figure } from 'rost/components/figure/Figure'

<Figure caption="Payments come in faster after the reminder.">
  <img src={chart} alt="Days to payment, before and after the reminder" />
</Figure>`

/** What the component's card on rost.build shows. */
export const preview = <div style={{ width: 240 }}><Figure caption="A contract becomes code and a drawing."><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 240, height: 120 }}><Illustration name="design-system" /></div></Figure></div>
