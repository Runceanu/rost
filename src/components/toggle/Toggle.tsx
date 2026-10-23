import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './toggle.css'

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** On or off. Off is a faded plate with 12px corners, on a fully round primary pill. */
  readonly selected?: boolean
  /** Replaces the arrow. Draw it with `currentColor` and it follows the states. With a label, there's no icon unless you pass one. */
  readonly icon?: ReactNode
  /** A text label, like a year. The toggle grows wider than 40px to fit it. */
  readonly children?: ReactNode
  /** Needed when there's no label: say what it switches. */
  readonly 'aria-label'?: string
  /** `span` draws it without the button, for a preview inside something that's already a link or a button. */
  readonly as?: 'button' | 'span'
}

const b = 'rost-toggle'

/**
 * A button that stays on or off. On its own it's `aria-pressed`. In a group
 * of options, pass `role="radio"` and `aria-checked` instead. Built from
 * contracts/toggle.contract.yaml.
 */
export function Toggle({ selected = false, icon, children, className, as = 'button', disabled, type = 'button', ...rest }: ToggleProps) {
  const labelled = children !== undefined && children !== null && children !== false
  const radio = rest.role === 'radio'
  const Root = as
  const own = as === 'button' ? { type, disabled } : { 'aria-disabled': disabled || undefined }
  return (
    <Root
      {...own}
      className={[b, selected && `${b}--selected`, labelled && `${b}--labelled`, className].filter(Boolean).join(' ')}
      {...(radio ? { 'aria-checked': selected } : { 'aria-pressed': selected })}
      {...(rest as object)}
    >
      <span className={`${b}__background`} />
      {(icon || !labelled) && <span className={`${b}__icons-arrow-left`} aria-hidden="true">{icon ?? <span className={`${b}__glyph`} />}</span>}
      {labelled && <span className={`${b}__label`}>{children}</span>}
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}
