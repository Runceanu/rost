import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Divider } from '../divider/Divider'
import './menu.css'

export interface MenuProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  readonly title?: ReactNode
  readonly description?: ReactNode
  readonly showDescription?: boolean
  /** The line underneath. */
  readonly showDivider?: boolean
  /** Greys it out and drops the link. */
  readonly disabled?: boolean
  /** `div` draws it without the link, for a preview inside something that's already a link. */
  readonly as?: 'a' | 'div'
}

const b = 'rost-menu'

/**
 * One item in the main menu: a title, a line of description, and a divider.
 * It's a link; hover, press and focus are the browser's. Mark the current
 * page with `aria-current="page"`. Built from contracts/menu.contract.yaml.
 */
export function Menu({ title = 'Title', description = 'Description', showDescription = true, showDivider = true, disabled = false, className, href, as = 'a', ...rest }: MenuProps) {
  const Root = as
  const link = as === 'a' ? { href: disabled ? undefined : href, 'aria-disabled': disabled || undefined } : { 'aria-disabled': disabled || undefined }
  return (
    <Root className={[b, className].filter(Boolean).join(' ')} {...link} {...(rest as object)}>
      <span className={`${b}__content`}>
        <span className={`${b}__title`}>{title}</span>
        {showDescription && <span className={`${b}__description`}>{description}</span>}
      </span>
      {showDivider && <Divider className={`${b}__divider`} aria-hidden="true" />}
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}
