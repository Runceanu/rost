import { ToastStack } from './ToastStack'
import { Toast } from '../toast/Toast'
import { Button } from '../button/Button'

// Figma's ToastStack: two toasts, in place.
const sample = (
  <ToastStack placement="inline">
    <Toast tone="positive" action={<Button variant="borderless">Undo</Button>}>Invoice sent</Toast>
    <Toast tone="negative" action={<Button variant="borderless">Retry</Button>}>Couldn't sync</Toast>
  </ToastStack>
)
export const fixtures = [{ node: '741:84', name: 'placement=inline', element: <div style={{ width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { ToastStack } from 'rost/components/toast-stack/ToastStack'

<ToastStack>
  {toasts.map((t) => <Toast key={t.id} tone={t.tone} onClose={() => dismiss(t.id)}>{t.text}</Toast>)}
</ToastStack>`

/** What the component's card on rost.build shows. */
export const preview = sample
