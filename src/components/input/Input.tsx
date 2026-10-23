import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { IconButton } from '../icon-button/IconButton'
import './input.css'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** The field's name. It sits where you type until there's a value or focus, then moves up. */
  readonly label: ReactNode
  /** One line of help under the field, or the fix when there's an error. */
  readonly supportive?: ReactNode
  readonly error?: boolean
  /** The leading icon. Figma's lock by default; `null` for none. */
  readonly icon?: ReactNode
  /** Forces the focused look, for previews and tests. In use, it follows focus. */
  readonly selected?: boolean
  /** Called by the clear button. Without it there's no clear button. */
  readonly onClear?: () => void
}

const b = 'rost-input'

/**
 * A 56px text field with a floating label. Empty, it shows the label where
 * you'll type; with a value or focus, the label moves up small. Built from
 * contracts/input.contract.yaml.
 */
export function Input({
  label, supportive, error = false, icon, selected, onClear, className, id, value, defaultValue,
  onChange, onFocus, onBlur, disabled, ...rest
}: InputProps) {
  const own = useId()
  const inputId = id ?? own
  const helpId = `${inputId}-help`
  const [typed, setTyped] = useState(String(defaultValue ?? ''))
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const text = value !== undefined ? String(value) : typed
  const filled = text.length > 0
  const isSelected = selected ?? focused
  const cls = [b, `${b}--configuration-${filled ? 'filled' : 'empty'}`, isSelected && `${b}--selected`, error && `${b}--error`, className].filter(Boolean).join(' ')
  return (
    // The whole field is the target: a press anywhere in it, other than on the
    // clear button, puts the caret in the input. Empty, the input is 0px tall.
    <div className={cls} onMouseDown={(e) => {
      if (disabled || e.target === ref.current || (e.target as Element).closest('button')) return
      e.preventDefault(); ref.current?.focus()
    }}>
      <span className={`${b}__outline`} />
      <span className={`${b}__left`}>
        {icon === undefined ? <span className={`${b}__icons-lock`} aria-hidden="true" /> : icon}
        <span className={`${b}__content`}>
          <label className={`${b}__label`} htmlFor={inputId}>{label}</label>
          <input
            ref={ref}
            id={inputId}
            className={`${b}__value`}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            disabled={disabled}
            aria-invalid={error || undefined}
            aria-describedby={supportive ? helpId : undefined}
            onChange={(e) => { if (value === undefined) setTyped(e.target.value); onChange?.(e) }}
            onFocus={(e) => { setFocused(true); onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); onBlur?.(e) }}
            {...rest}
          />
        </span>
      </span>
      {error ? (
        <span className={`${b}__right`}><span className={`${b}__icons-alarm`} aria-hidden="true" /></span>
      ) : filled && onClear && !disabled ? (
        <span className={`${b}__right`}>
          <IconButton variant="project" aria-label="Clear" icon={<span className={`${b}__clear-glyph`} />} onClick={() => { onClear(); ref.current?.focus() }} />
        </span>
      ) : null}
      {supportive && <span className={`${b}__supportive`} id={helpId}>{supportive}</span>}
      <span className={`${b}__focus-ring`} />
    </div>
  )
}
