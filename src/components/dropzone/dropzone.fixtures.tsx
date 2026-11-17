import { Dropzone } from './Dropzone'

// One fixture per Figma variant, 360px wide.
type V = [name: string, over: boolean, error: boolean, help: string, node: string]
const VARIANTS: V[] = [
  ['over=False, error=False', false, false, 'PDF or CSV, up to 10 MB', '746:91'],
  ['over=True, error=False', true, false, 'PDF or CSV, up to 10 MB', '746:106'],
  ['over=False, error=True', false, true, "That's a PNG. Try a PDF or CSV.", '746:119'],
]
export const fixtures = VARIANTS.map(([name, over, error, help, node]) => ({
  node,
  name,
  element: <div style={{ width: 360 }}><Dropzone over={over} error={error} title="Drop a bank statement here" help={help} accept=".pdf,.csv" /></div>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Dropzone } from 'rost/components/dropzone/Dropzone'

<Dropzone
  title="Drop a bank statement here"
  help={wrong ? "That's a PNG. Try a PDF or CSV." : 'PDF or CSV, up to 10 MB'}
  error={wrong}
  accept=".pdf,.csv"
  onFiles={importStatement}
/>`

/** What the component's card on rost.build shows. */
export const preview = <div style={{ width: 320 }}><Dropzone title="Drop a bank statement here" help="PDF or CSV, up to 10 MB" /></div>
