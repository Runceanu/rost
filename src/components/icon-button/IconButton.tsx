import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './icon-button.css'

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'project'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The look: Figma's `type` axis. */
  readonly variant?: IconButtonVariant
  /** Replaces the arrow. Draw it with `currentColor` and it follows the states. */
  readonly icon?: ReactNode
  /** Required: there's no visible text. Say what it does, not what it shows. */
  readonly 'aria-label': string
  /** `span` draws it without the button, for a preview inside something that's already a link or a button. */
  readonly as?: 'button' | 'span'
}

const b = 'rost-icon-button'

/**
 * A round button with only an icon. Hover, press and focus are the browser's.
 * Built from contracts/icon-button.contract.yaml.
 */
export function IconButton({ variant = 'primary', icon, className, type = 'button', as = 'button', disabled, ...rest }: IconButtonProps) {
  const Root = as
  const own = as === 'button' ? { type, disabled } : { 'aria-disabled': disabled || undefined }
  return (
    <Root className={[b, `${b}--type-${variant}`, className].filter(Boolean).join(' ')} {...own} {...(rest as object)}>
      <span className={`${b}__background`} />
      <span className={`${b}__icons-arrow-left`} aria-hidden="true">{icon ?? <span className={`${b}__glyph`} />}</span>
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}
