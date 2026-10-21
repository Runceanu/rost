import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './icon-button.css'

export type IconButtonType = 'primary' | 'secondary' | 'tertiary' | 'project'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  readonly type?: IconButtonType
  /** Replaces the arrow. Draw it with `currentColor` and it follows the states. */
  readonly icon?: ReactNode
  /** Required: there's no visible text. Say what it does, not what it shows. */
  readonly 'aria-label': string
  readonly buttonType?: 'button' | 'submit' | 'reset'
  /** `span` draws it without the button, for a preview inside something that's already a link or a button. */
  readonly as?: 'button' | 'span'
}

const b = 'rost-icon-button'

/**
 * A round button with only an icon. Hover, press and focus are the browser's.
 * Built from contracts/icon-button.contract.yaml.
 */
export function IconButton({ type = 'primary', icon, className, buttonType = 'button', as = 'button', disabled, ...rest }: IconButtonProps) {
  const Root = as
  const own = as === 'button' ? { type: buttonType, disabled } : { 'aria-disabled': disabled || undefined }
  return (
    <Root className={[b, `${b}--type-${type}`, className].filter(Boolean).join(' ')} {...own} {...(rest as object)}>
      <span className={`${b}__background`} />
      <span className={`${b}__icons-arrow-left`} aria-hidden="true">{icon ?? <span className={`${b}__glyph`} />}</span>
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}
