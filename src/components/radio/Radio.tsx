import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import './radio.css'

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** The words beside it. Without them, give it an `aria-label`. */
  readonly children?: ReactNode
  /** Called with the new value each time it changes. */
  readonly onCheckedChange?: (checked: boolean) => void
}

const b = 'rost-radio'

/**
 * One choice out of a few. A real `<input type="radio">`: give the radios of one
 * question the same `name` and put them in a `<fieldset>` with a `<legend>`.
 * It sits inside a `<label>`, so forms, Space and screen readers work as they always do.
 * Built from contracts/radio.contract.yaml.
 */
export function Radio({ children, checked, defaultChecked = false, onChange, onCheckedChange, className, style, ...rest }: RadioProps) {
  const [own, setOwn] = useState(defaultChecked)
  const on = checked ?? own
  const input = useRef<HTMLInputElement>(null)
  // Picking another radio of the group unpicks this one without telling it,
  // so on its own it listens for changes in its group.
  useEffect(() => {
    if (checked !== undefined) return
    const sync = (e: Event) => {
      const t = e.target as HTMLInputElement
      if (t !== input.current && t.type === 'radio' && t.name && t.name === input.current?.name) setOwn(input.current.checked)
    }
    document.addEventListener('change', sync)
    return () => document.removeEventListener('change', sync)
  }, [checked])
  return (
    <label className={[b, on && `${b}--checked`, className].filter(Boolean).join(' ')} style={style}>
      <input
        ref={input}
        type="radio"
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
        <span className={`${b}__dot`} />
        <span className={`${b}__focus-ring`} />
      </span>
      {children != null && <span className={`${b}__label`}>{children}</span>}
    </label>
  )
}
