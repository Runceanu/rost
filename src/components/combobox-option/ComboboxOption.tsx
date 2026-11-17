import type { HTMLAttributes, ReactNode } from 'react'
import './combobox-option.css'

export interface ComboboxOptionProps extends HTMLAttributes<HTMLDivElement> {
  /** The picked one. */
  readonly selected?: boolean
  /** Highlighted by the arrow keys or the pointer. */
  readonly active?: boolean
  readonly children: ReactNode
}

const b = 'rost-combobox-option'

/** One option in a Combobox's list. Built from contracts/combobox-option.contract.yaml. */
export function ComboboxOption({ selected = false, active = false, children, className, ...rest }: ComboboxOptionProps) {
  return (
    <div role="option" aria-selected={selected} className={[b, selected && `${b}--selected`, active && `${b}--active`, className].filter(Boolean).join(' ')} {...rest}>
      <span>{children}</span>
      {selected && <span className={`${b}__check`} aria-hidden="true" />}
    </div>
  )
}
