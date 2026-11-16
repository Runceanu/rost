import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import './select.css'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** The field's name, small at the top. */
  readonly label: ReactNode
  /** The `<option>`s. */
  readonly children?: ReactNode
}

const b = 'rost-select'

/**
 * One choice from a long list. A real `<select>` over Input's filled field, so
 * the list that opens is the browser's own. Built from
 * contracts/select.contract.yaml.
 */
export function Select({ label, children, id, className, style, ...rest }: SelectProps) {
  const made = useId()
  const fieldId = id ?? made
  return (
    <div className={[b, className].filter(Boolean).join(' ')} style={style}>
      <span className={`${b}__outline`} aria-hidden="true" />
      <select id={fieldId} className={`${b}__field`} {...rest}>{children}</select>
      <label className={`${b}__label`} htmlFor={fieldId}>{label}</label>
      <span className={`${b}__chevron`} aria-hidden="true" />
      <span className={`${b}__focus-ring`} aria-hidden="true" />
    </div>
  )
}
