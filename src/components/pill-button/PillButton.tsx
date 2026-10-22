import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import './pill-button.css'

export type PillButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'borderless'

interface Common {
  /** The look: Figma's `type` axis. */
  readonly variant?: PillButtonVariant
  /** Optional, in front of the label: a 20px icon. Figma's `leading` slot, off by default. */
  readonly icon?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  /** `span` draws it without the button or link, for a preview inside something that's already one. */
  readonly as?: 'span'
}
export type PillButtonProps =
  | (Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { readonly href?: undefined; readonly type?: 'button' | 'submit' | 'reset' })
  | (Common & AnchorHTMLAttributes<HTMLAnchorElement> & { readonly href: string; readonly disabled?: boolean })

const b = 'rost-pill-button'

/**
 * A rounded button with a label and an optional icon. A `<button>`, or an
 * `<a>` when it has an `href`. Hover, press and focus are the browser's.
 * Built from contracts/pill-button.contract.yaml.
 */
export function PillButton(props: PillButtonProps) {
  const { variant = 'primary', icon, children, className, as, ...rest } = props
  const cls = [b, `${b}--type-${variant}`, className].filter(Boolean).join(' ')
  const inner = (
    <>
      <span className={`${b}__background`} />
      {icon && <span className={`${b}__icons-arrow-left`} aria-hidden="true">{icon}</span>}
      <span className={`${b}__label`}>{children}</span>
      <span className={`${b}__focus-ring`} />
    </>
  )
  if (as === 'span') {
    const { disabled } = rest as { disabled?: boolean }
    return <span className={cls} aria-disabled={disabled || undefined}>{inner}</span>
  }
  if ('href' in rest && rest.href !== undefined) {
    const { href, disabled, ...a } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { disabled?: boolean }
    return <a className={cls} href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...a}>{inner}</a>
  }
  const { type = 'button', ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return <button type={type} className={cls} {...btn}>{inner}</button>
}
