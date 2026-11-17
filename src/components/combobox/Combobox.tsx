import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { ComboboxOption } from '../combobox-option/ComboboxOption'
import './combobox.css'

export interface ComboboxItem {
  readonly value: string
  readonly label: string
}

export interface ComboboxProps {
  /** The field's name, small at the top. */
  readonly label: ReactNode
  /** The options, in order. */
  readonly options: readonly ComboboxItem[]
  /** The picked option's value. */
  readonly value?: string | null
  readonly onValueChange?: (value: string) => void
  /** What the empty field says once it has the focus. */
  readonly placeholder?: string
  /** What the list says when nothing matches. */
  readonly empty?: string
  /** One line under the field: help, or what to fix. */
  readonly supportive?: ReactNode
  /** Select's red. */
  readonly error?: boolean
  readonly disabled?: boolean
  readonly id?: string
  readonly className?: string
}

const b = 'rost-combobox'

/**
 * One choice from a long list, found by typing. An `<input role="combobox">`
 * over Select's field and a filtered `role="listbox"` under it, the ARIA
 * pattern with `aria-activedescendant`. Built from contracts/combobox.contract.yaml.
 */
export function Combobox({ label, options, value = null, onValueChange, placeholder, empty = 'No match', supportive, error = false, disabled = false, id, className }: ComboboxProps) {
  const made = useId()
  const fieldId = id ?? made
  const listId = `${fieldId}-list`
  const helpId = `${fieldId}-help`
  const anchor = `--rost-combobox-${made.replace(/[^a-zA-Z0-9]/g, '')}`
  const list = useRef<HTMLDivElement>(null)
  const picked = options.find((o) => o.value === value) ?? null
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const shown = query == null ? options : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
  const optId = (i: number) => `${fieldId}-opt-${i}`
  // Keep the highlighted option in view when the list scrolls.
  useEffect(() => { if (open) document.getElementById(optId(active))?.scrollIntoView({ block: 'nearest' }) }, [open, active])

  const show = (on: boolean) => {
    const el = list.current
    if (!el) return
    if (on && !el.matches(':popover-open')) el.showPopover()
    if (!on && el.matches(':popover-open')) el.hidePopover()
    setOpen(on)
  }
  const openAt = (i: number) => { setActive(i); show(true) }
  const pick = (o: ComboboxItem) => { onValueChange?.(o.value); setQuery(null); show(false) }
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) openAt(Math.max(0, shown.findIndex((o) => o.value === value))); else setActive((a) => Math.min(a + 1, shown.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (open) setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { if (open && shown[active]) { e.preventDefault(); pick(shown[active]) } }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); show(false) } else setQuery(null) }
  }

  return (
    <div className={[b, error && `${b}--error`, className].filter(Boolean).join(' ')} style={{ anchorName: anchor } as CSSProperties}>
      <span className={`${b}__outline`} aria-hidden="true" />
      <input
        id={fieldId}
        className={`${b}__field`}
        role="combobox"
        type="text"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={query ?? picked?.label ?? ''}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? optId(active) : undefined}
        aria-invalid={error || undefined}
        aria-describedby={supportive != null ? helpId : undefined}
        onChange={(e) => { setQuery(e.target.value); openAt(0) }}
        onKeyDown={key}
        onClick={() => { if (!open) openAt(Math.max(0, shown.findIndex((o) => o.value === value))) }}
        onBlur={() => { setQuery(null); show(false) }}
      />
      <label className={`${b}__label`} htmlFor={fieldId}>{label}</label>
      <span className={`${b}__chevron`} aria-hidden="true" />
      {supportive != null && <span id={helpId} className={`${b}__supportive`}>{supportive}</span>}
      <span className={`${b}__focus-ring`} aria-hidden="true" />
      <div ref={list} id={listId} popover="manual" role="listbox" aria-labelledby={fieldId} className={`${b}__listbox`} style={{ positionAnchor: anchor } as CSSProperties}>
        {shown.length ? shown.map((o, i) => (
          <ComboboxOption
            key={o.value}
            id={optId(i)}
            selected={o.value === value}
            active={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(i)}
            onClick={() => pick(o)}
          >
            {o.label}
          </ComboboxOption>
        )) : <div className={`${b}__empty`}>{empty}</div>}
      </div>
    </div>
  )
}
