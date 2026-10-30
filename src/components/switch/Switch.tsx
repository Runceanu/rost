import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import './switch.css'

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** On or off, when you control it. */
  readonly checked?: boolean
  /** Where it starts when it looks after itself. */
  readonly defaultChecked?: boolean
  /** Called with the new value each time it flips. */
  readonly onCheckedChange?: (checked: boolean) => void
  /** What it turns on, after the track: "Email me receipts". Without one, pass an `aria-label`. */
  readonly children?: ReactNode
  /** `span` draws it without the button, for a preview inside something that's already a link or a button. */
  readonly as?: 'button' | 'span'
}

const b = 'rost-switch'

/**
 * A setting that's on or off and takes effect straight away. A
 * `<button role="switch">`, so Space and Enter flip it and the label is its
 * name. Built from contracts/switch.contract.yaml.
 */
export function Switch({
  checked, defaultChecked = false, onCheckedChange, children, className, as = 'button',
  disabled, type = 'button', onClick, ...rest
}: SwitchProps) {
  const [own, setOwn] = useState(defaultChecked)
  const on = checked ?? own
  const cls = [b, on && `${b}--checked`, className].filter(Boolean).join(' ')
  const inner = (
    <>
      <span className={`${b}__track`}>
        <span className={`${b}__background`} />
        <span className={`${b}__thumb`} />
        <span className={`${b}__focus-ring`} />
      </span>
      {children !== undefined && children !== null && children !== false && <span className={`${b}__label`}>{children}</span>}
    </>
  )
  if (as === 'span') return <span className={cls} aria-disabled={disabled || undefined}>{inner}</span>
  return (
    <button
      type={type}
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={cls}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (checked === undefined) setOwn(!on)
        onCheckedChange?.(!on)
      }}
      {...rest}
    >
      {inner}
    </button>
  )
}
