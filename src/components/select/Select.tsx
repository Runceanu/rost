import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import './select.css'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** The field's name, small at the top. */
  readonly label: ReactNode
  /** The `<option>`s. */
  readonly children?: ReactNode
  /** One line under the field: help, or what to fix. */
  readonly supportive?: ReactNode
  /** Input's red. Say what's wrong in `supportive`. */
  readonly error?: boolean
}

const b = 'rost-select'

/**
 * One choice from a long list. A real `<select>` over Input's filled field, so
 * the list that opens is the browser's own. Built from
 * contracts/select.contract.yaml.
 */
export function Select({ label, children, supportive, error = false, id, className, style, ...rest }: SelectProps) {
  const made = useId()
  const fieldId = id ?? made
  const helpId = `${fieldId}-help`
  return (
    <div className={[b, error && `${b}--error`, className].filter(Boolean).join(' ')} style={style}>
      <span className={`${b}__outline`} aria-hidden="true" />
      <select id={fieldId} className={`${b}__field`} aria-invalid={error || undefined} aria-describedby={supportive != null ? helpId : undefined} {...rest}>{children}</select>
      <label className={`${b}__label`} htmlFor={fieldId}>{label}</label>
      <span className={`${b}__chevron`} aria-hidden="true" />
      {supportive != null && <span id={helpId} className={`${b}__supportive`}>{supportive}</span>}
      <span className={`${b}__focus-ring`} aria-hidden="true" />
    </div>
  )
}
