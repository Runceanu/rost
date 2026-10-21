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
}

const b = 'rost-icon-button'

/**
 * A round button with only an icon. Hover, press and focus are the browser's.
 * Built from contracts/icon-button.contract.yaml.
 */
export function IconButton({ type = 'primary', icon, className, buttonType = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={buttonType} className={[b, `${b}--type-${type}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__background`} />
      <span className={`${b}__icons-arrow-left`} aria-hidden="true">{icon ?? <span className={`${b}__glyph`} />}</span>
      <span className={`${b}__focus-ring`} />
    </button>
  )
}
