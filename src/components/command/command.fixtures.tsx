import { Command } from './Command'

// Figma's Command: drawn in place, the accounting app's commands, the first one highlighted.
const groups = [
  { label: 'Go to', items: [{ value: 'dashboard', label: 'Dashboard' }, { value: 'invoices', label: 'Invoices' }, { value: 'clients', label: 'Clients' }] },
  { label: 'Create', items: [{ value: 'new-invoice', label: 'New invoice' }, { value: 'new-client', label: 'New client' }] },
]
const sample = <Command preview groups={groups} />
export const fixtures = [{ node: '758:10', name: 'command', element: <div style={{ width: 'fit-content' }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Command } from 'rost/components/command/Command'

// Open it with ⌘K.
useEffect(() => {
  const key = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(true) } }
  addEventListener('keydown', key)
  return () => removeEventListener('keydown', key)
}, [])

<Command
  open={open}
  onClose={() => setOpen(false)}
  groups={[
    { label: 'Go to', items: [{ value: 'invoices', label: 'Invoices', onSelect: () => go('/invoices') }] },
    { label: 'Create', items: [{ value: 'new-invoice', label: 'New invoice', onSelect: newInvoice }] },
  ]}
/>`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'block', pointerEvents: 'none', width: 300, overflow: 'hidden' }}>{sample}</span>
