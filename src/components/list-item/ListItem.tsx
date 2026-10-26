import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import './list-item.css'

interface Common {
  /** The picked one: a solid green plate. In a nav, also set `aria-current="page"`. */
  readonly selected?: boolean
  /** One short line under the label. */
  readonly description?: ReactNode
  /** A 20px icon before the text. Draw it with `currentColor`. */
  readonly leading?: ReactNode
  /** Shows the status dot on the right. */
  readonly badge?: boolean
  /** A 20px icon at the end, usually a chevron. Draw it with `currentColor`. */
  readonly action?: ReactNode
  /** The label. */
  readonly children?: ReactNode
  readonly className?: string
  /** `span` draws it without the link or button, for a preview inside something that's already one. */
  readonly as?: 'span'
}
export type ListItemProps =
  | (Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { readonly href?: undefined; readonly type?: 'button' | 'submit' | 'reset' })
  | (Common & AnchorHTMLAttributes<HTMLAnchorElement> & { readonly href: string; readonly disabled?: boolean })

const b = 'rost-list-item'

/**
 * One row you can pick in a list or a nav. A link when it has an `href`,
 * otherwise a `<button>`. Hover, pressed and focus are the browser's.
 * Built from contracts/list-item.contract.yaml.
 */
export function ListItem(props: ListItemProps) {
  const { selected = false, description, leading, badge = false, action, children, className, as, ...rest } = props
  // No label and nothing at the end: just the icon, centred, as in a collapsed nav.
  const iconOnly = !children && !description && !badge && !action
  const cls = [b, selected && `${b}--selected`, iconOnly && `${b}--icon-only`, className].filter(Boolean).join(' ')
  const inner = (
    <>
      <span className={`${b}__background`} />
      <span className={`${b}__start`}>
        {leading && <span className={`${b}__leading`} aria-hidden="true">{leading}</span>}
        {(children || description) && (
          <span className={`${b}__text`}>
            <span className={`${b}__label`}>{children}</span>
            {description && <span className={`${b}__description`}>{description}</span>}
          </span>
        )}
      </span>
      {(badge || action) && (
        <span className={`${b}__end`}>
          {badge && <span className={`${b}__badge`}><span className={`${b}__dot`} /></span>}
          {action && <span className={`${b}__action`} aria-hidden="true">{action}</span>}
        </span>
      )}
      <span className={`${b}__focus-ring`} />
    </>
  )
  if (as === 'span') return <span className={cls}>{inner}</span>
  if ('href' in rest && rest.href !== undefined) {
    const { href, disabled, ...a } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { disabled?: boolean }
    return <a className={cls} href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...a}>{inner}</a>
  }
  const { type = 'button', ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return <button type={type} className={cls} {...btn}>{inner}</button>
}
