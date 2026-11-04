import type { AnchorHTMLAttributes, ReactNode } from 'react'
import './link.css'

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly href: string
  /** `accent` in a sentence; `quiet` where every word is a link. */
  readonly tone?: 'accent' | 'quiet'
  /** Opens in a new tab, and says so to screen readers. */
  readonly external?: boolean
  readonly children?: ReactNode
}

const b = 'rost-link'

/** A link inside text. Built from contracts/link.contract.yaml. */
export function Link({ tone = 'accent', external = false, className, children, ...rest }: LinkProps) {
  const ext = external ? { target: '_blank', rel: 'noreferrer' } : {}
  return (
    <a className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')} {...ext} {...rest}>
      {children}
      {external && <span className={`${b}__label`}> (opens in a new tab)</span>}
    </a>
  )
}
