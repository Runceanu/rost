import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './chips.css'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** One or two words. */
  readonly children?: ReactNode
  /** `span` draws it without the button, for a preview inside something that's already a link or a button. */
  readonly as?: 'button' | 'span'
}

const b = 'rost-chips'

/**
 * A filter or a quick pick. Always a button: hover, press and focus are the
 * browser's. There's no selected chip in the kit yet, so there's no
 * `selected` prop either. Built from contracts/chips.contract.yaml.
 */
export function Chip({ children, className, type = 'button', as = 'button', disabled, ...rest }: ChipProps) {
  const Root = as
  const own = as === 'button' ? { type, disabled } : { 'aria-disabled': disabled || undefined }
  return (
    <Root className={[b, `${b}--status-default`, className].filter(Boolean).join(' ')} {...own} {...(rest as object)}>
      <span className={`${b}__label`}>{children}</span>
      <span className={`${b}__outline`} />
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}
