import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react'
import { ComboboxOption } from '../combobox-option/ComboboxOption'
import './command.css'

export interface CommandItem {
  readonly value: string
  readonly label: string
  readonly onSelect?: () => void
}

export interface CommandGroup {
  readonly label: string
  readonly items: readonly CommandItem[]
}

export interface CommandProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'onSelect'> {
  /** Shows it as a modal. */
  readonly open?: boolean
  /** Called when it closes, by Esc, a command or otherwise. */
  readonly onClose?: () => void
  /** The commands, in groups. */
  readonly groups: readonly CommandGroup[]
  /** What the empty field says. */
  readonly placeholder?: string
  /** What the list says when nothing matches. */
  readonly empty?: string
  /** The palette's name for screen readers. */
  readonly label?: string
  /** Draws it in place, without the modal, for previews. */
  readonly preview?: boolean
}

const b = 'rost-command'

/**
 * A palette for doing anything from the keyboard. A modal `<dialog>` with a
 * search field and the commands in groups, narrowing as you type.
 * Built from contracts/command.contract.yaml.
 */
export function Command({ open = false, onClose, groups, placeholder = 'Type a command or search', empty = 'No match', label = 'Command', preview = false, className, ...rest }: CommandProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const d = ref.current
    if (!d || preview) return
    if (open && !d.open) { setQuery(''); setActive(0); d.showModal(); input.current?.focus() }
    if (!open && d.open) d.close()
  }, [open, preview])

  const q = query.trim().toLowerCase()
  const shown = groups.map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) })).filter((g) => g.items.length)
  const flat = shown.flatMap((g) => g.items)
  const optId = (i: number) => `${id}-opt-${i}`
  useEffect(() => { document.getElementById(optId(active))?.scrollIntoView({ block: 'nearest' }) }, [active])

  const run = (it: CommandItem | undefined) => {
    if (!it) return
    ref.current?.close()
    it.onSelect?.()
  }
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(flat[active]) }
  }

  let n = -1
  const panel = (
    <div className={`${b}__panel`}>
      <input
        ref={input}
        className={`${b}__search`}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label={label}
        aria-expanded
        aria-controls={`${id}-list`}
        aria-activedescendant={flat[active] ? optId(active) : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActive(0) }}
        onKeyDown={key}
      />
      <div id={`${id}-list`} className={`${b}__list`} role="listbox" aria-label={label}>
        {shown.length ? shown.map((g) => (
          <div key={g.label} role="group" aria-labelledby={`${id}-${g.label}`}>
            <div id={`${id}-${g.label}`} className={`${b}__group-label`} role="presentation">{g.label}</div>
            {g.items.map((it) => {
              const i = ++n
              return (
                <ComboboxOption key={it.value} id={optId(i)} active={i === active} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => run(it)}>
                  {it.label}
                </ComboboxOption>
              )
            })}
          </div>
        )) : <div className={`${b}__empty`}>{empty}</div>}
      </div>
    </div>
  )
  const cls = [b, className].filter(Boolean).join(' ')
  if (preview) return <div className={cls} role="dialog" aria-label={label}>{panel}</div>
  return <dialog ref={ref} className={cls} aria-label={label} onClose={onClose} {...rest}>{panel}</dialog>
}
