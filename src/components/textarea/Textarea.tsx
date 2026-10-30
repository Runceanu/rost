import { useId, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react'
import './textarea.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** The field's name, small at the top. */
  readonly label: ReactNode
  /** One line of help under the field, or the fix when there's an error. */
  readonly supportive?: ReactNode
  readonly error?: boolean
  /** Forces the focused look, for previews and tests. In use, it follows focus. */
  readonly selected?: boolean
}

const b = 'rost-textarea'

/**
 * A text field for several lines. Input grown down: the same label, help
 * line, error and focus ring, from the same tokens. Built from
 * contracts/textarea.contract.yaml.
 */
export function Textarea({
  label, supportive, error = false, selected, className, id, rows = 3, onFocus, onBlur, disabled, ...rest
}: TextareaProps) {
  const own = useId()
  const fieldId = id ?? own
  const helpId = `${fieldId}-help`
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const isSelected = selected ?? focused
  const cls = [b, isSelected && `${b}--selected`, error && `${b}--error`, className].filter(Boolean).join(' ')
  return (
    // The whole field is the target: a press on the padding or the label puts the caret in the textarea.
    <div className={cls} onMouseDown={(e) => {
      if (disabled || e.target === ref.current) return
      e.preventDefault(); ref.current?.focus()
    }}>
      <span className={`${b}__outline`} />
      <span className={`${b}__header`}>
        <label className={`${b}__label`} htmlFor={fieldId}>{label}</label>
        {error && <span className={`${b}__icons-alarm`} aria-hidden="true" />}
      </span>
      <textarea
        ref={ref}
        id={fieldId}
        className={`${b}__value`}
        rows={rows}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={supportive ? helpId : undefined}
        onFocus={(e) => { setFocused(true); onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); onBlur?.(e) }}
        {...rest}
      />
      {supportive && <span className={`${b}__supportive`} id={helpId}>{supportive}</span>}
      <span className={`${b}__focus-ring`} />
    </div>
  )
}
