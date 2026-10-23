import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import './button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'borderless'

interface Common {
  /** The look: Figma's `type` axis. */
  readonly variant?: ButtonVariant
  /** Optional, in front of the label: a 20px icon. Figma's `leading` slot, off by default. */
  readonly icon?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  /** `span` draws it without the button or link: for a preview inside something that's already one, or the current page in a nav (with `aria-current="page"`). */
  readonly as?: 'span'
}
export type ButtonProps =
  | (Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { readonly href?: undefined; readonly type?: 'button' | 'submit' | 'reset' })
  | (Common & AnchorHTMLAttributes<HTMLAnchorElement> & { readonly href: string; readonly disabled?: boolean })

const b = 'rost-button'

/**
 * A 48px button with a label and an optional icon in front. A `<button>`, or an
 * `<a>` when it has an `href`. Hover, press and focus are the browser's.
 * Built from contracts/button.contract.yaml.
 */
export function Button(props: ButtonProps) {
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
    const { disabled, type: _type, ...span } = rest as ButtonHTMLAttributes<HTMLButtonElement>
    return <span className={cls} aria-disabled={disabled || undefined} {...(span as HTMLAttributes<HTMLSpanElement>)}>{inner}</span>
  }
  if ('href' in rest && rest.href !== undefined) {
    const { href, disabled, ...a } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { disabled?: boolean }
    return <a className={cls} href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...a}>{inner}</a>
  }
  const { type = 'button', ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return <button type={type} className={cls} {...btn}>{inner}</button>
}
