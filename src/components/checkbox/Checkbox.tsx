import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import './checkbox.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** The words beside it. Without them, give it an `aria-label`. */
  readonly children?: ReactNode
  /** Called with the new value each time it changes. */
  readonly onCheckedChange?: (checked: boolean) => void
}

const b = 'rost-checkbox'

/**
 * A choice that's on or off and waits for the form. A real `<input type="checkbox">` inside a
 * `<label>`, so forms, Space and screen readers work as they always do.
 * Built from contracts/checkbox.contract.yaml.
 */
export function Checkbox({ children, checked, defaultChecked = false, onChange, onCheckedChange, className, style, ...rest }: CheckboxProps) {
  const [own, setOwn] = useState(defaultChecked)
  const on = checked ?? own
  return (
    <label className={[b, on && `${b}--checked`, className].filter(Boolean).join(' ')} style={style}>
      <input
        type="checkbox"
        className={`${b}__input`}
        checked={on}
        onChange={(e) => {
          onChange?.(e)
          if (checked === undefined) setOwn(e.target.checked)
          onCheckedChange?.(e.target.checked)
        }}
        {...rest}
      />
      <span className={`${b}__box`} aria-hidden="true">
        <span className={`${b}__check`} />
        <span className={`${b}__focus-ring`} />
      </span>
      {children != null && <span className={`${b}__label`}>{children}</span>}
    </label>
  )
}
