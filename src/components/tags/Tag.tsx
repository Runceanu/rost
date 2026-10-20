import type { AnchorHTMLAttributes, ReactNode } from 'react'
import './tags.css'

export interface TagProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The word. */
  readonly children?: ReactNode
  /** Greys it out. A disabled linked tag drops its href. */
  readonly disabled?: boolean
}

const b = 'rost-tags'

/**
 * What something is about: a discipline, a platform. Static it's a `<span>`.
 * Give it an `href` and it becomes a link, with hover, press and focus.
 * Built from contracts/tags.contract.yaml.
 */
export function Tag({ children, href, disabled = false, className, ...rest }: TagProps) {
  const cls = [b, `${b}--type-primary`, className].filter(Boolean).join(' ')
  const inner = (
    <>
      <span className={`${b}__label`}>{children}</span>
      <span className={`${b}__focus-ring`} />
    </>
  )
  if (href === undefined) return <span className={cls} aria-disabled={disabled || undefined} {...(rest as object)}>{inner}</span>
  return <a className={cls} href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...rest}>{inner}</a>
}
