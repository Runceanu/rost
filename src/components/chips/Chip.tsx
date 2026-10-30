import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './chips.css'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** One or two words. */
  readonly children?: ReactNode
  /** `span` draws it without the button, for a preview inside something that's already a link or a button. */
  readonly as?: 'button' | 'span'
  /**
   * The chip that's on: a solid green plate, as a selected ListItem. Sets
   * `aria-pressed` too. Leave it out on a chip that isn't a filter.
   * Proposed: drawn in code, not in Figma yet.
   */
  readonly selected?: boolean
}

const b = 'rost-chips'

/**
 * A filter or a quick pick. Always a button: hover, press and focus are the
 * browser's. `selected` is the proposed on look, until Figma has one.
 * Built from contracts/chips.contract.yaml.
 */
export function Chip({ children, className, type = 'button', as = 'button', disabled, selected, ...rest }: ChipProps) {
  const Root = as
  const own = as === 'button'
    ? { type, disabled, 'aria-pressed': selected }
    : { 'aria-disabled': disabled || undefined }
  return (
    <Root className={[b, `${b}--status-default`, selected && `${b}--selected`, className].filter(Boolean).join(' ')} {...own} {...(rest as object)}>
      <span className={`${b}__background`} />
      <span className={`${b}__label`}>{children}</span>
      <span className={`${b}__outline`} />
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}
