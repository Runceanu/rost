import type { HTMLAttributes, ReactNode } from 'react'
import './description-list.css'

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  /** The pairs, in order. */
  readonly items: readonly { readonly term: ReactNode; readonly detail: ReactNode }[]
}

const b = 'rost-description-list'

/** Facts about one thing, as pairs. Built from contracts/description-list.contract.yaml. */
export function DescriptionList({ items, className, ...rest }: DescriptionListProps) {
  return (
    <dl className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {items.map((item, i) => (
        <div key={i} className={`${b}__row`}>
          <dt className={`${b}__term`}>{item.term}</dt>
          <dd className={`${b}__detail`}>{item.detail}</dd>
        </div>
      ))}
    </dl>
  )
}
