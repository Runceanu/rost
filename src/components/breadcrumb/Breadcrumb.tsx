import type { HTMLAttributes } from 'react'
import { Link } from '../link/Link'
import './breadcrumb.css'

export interface BreadcrumbItem {
  readonly label: string
  /** Leave it out on the last one: that's this page. */
  readonly href?: string
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** The pages from the top down. */
  readonly items: readonly BreadcrumbItem[]
}

const b = 'rost-breadcrumb'

/**
 * Where this page sits, from the top down. Every page above is a quiet Link;
 * this one is last. Built from contracts/breadcrumb.contract.yaml.
 */
export function Breadcrumb({ items, className, ...rest }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <ol className={`${b}__list`}>
        {items.map((item, i) => i < items.length - 1 && item.href
          ? <li key={i} className={`${b}__item`}><Link tone="quiet" href={item.href}>{item.label}</Link><span className={`${b}__separator`} aria-hidden="true" /></li>
          : <li key={i} className={`${b}__current`} aria-current="page">{item.label}</li>)}
      </ol>
    </nav>
  )
}
