import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './toggle.css'

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** On or off. Off is a faded plate with 12px corners, on a fully round primary pill. */
  readonly selected?: boolean
  /** Replaces the arrow. Draw it with `currentColor` and it follows the states. */
  readonly icon?: ReactNode
  /** Required: it's icon only. */
  readonly 'aria-label': string
}

const b = 'rost-toggle'

/**
 * A button that stays on or off. On its own it's `aria-pressed`. In a group
 * of options, pass `role="radio"` and `aria-checked` instead. Built from
 * contracts/toggle.contract.yaml.
 */
export function Toggle({ selected = false, icon, className, ...rest }: ToggleProps) {
  const radio = rest.role === 'radio'
  return (
    <button
      type="button"
      className={[b, selected && `${b}--selected`, className].filter(Boolean).join(' ')}
      {...(radio ? { 'aria-checked': selected } : { 'aria-pressed': selected })}
      {...rest}
    >
      <span className={`${b}__background`} />
      <span className={`${b}__icons-arrow-left`} aria-hidden="true">{icon ?? <span className={`${b}__glyph`} />}</span>
      <span className={`${b}__focus-ring`} />
    </button>
  )
}
