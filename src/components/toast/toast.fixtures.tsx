import { Toast } from './Toast'
import { Button } from '../button/Button'

// One fixture per Figma variant: each tone, with Undo.
const NODES = ['738:52', '738:60', '738:68', '738:76', '741:69']
export const fixtures = [
  ...(['default', 'positive', 'warning', 'negative'] as const).map((tone, i) => ({
    node: NODES[i],
    name: `tone=${tone}, dismissible=False`,
    element: <Toast tone={tone} action={<Button variant="borderless">Undo</Button>}>Invoice sent</Toast>,
  })),
  { node: NODES[4], name: 'tone=default, dismissible=True', element: <Toast onClose={() => {}}>Your bank sync is back on</Toast> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Toast } from 'rost/components/toast/Toast'

<Toast tone="positive" action={<Button variant="borderless" onClick={undo}>Undo</Button>}>
  Invoice sent
</Toast>`

/** What the component's card on rost.build shows. */
export const preview = <Toast tone="positive" action={<Button variant="borderless" as="span">Undo</Button>}>Invoice sent</Toast>
