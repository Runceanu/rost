import type { HTMLAttributes, ReactNode } from 'react'
import './empty-state.css'

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** One of Rost's Illustrations. */
  readonly illustration?: ReactNode
  /** Why it's empty, in a few words. */
  readonly title: ReactNode
  /** The Button that does something about it. */
  readonly action?: ReactNode
  /** The title's heading level. */
  readonly as?: 'h2' | 'h3' | 'h4'
  readonly children?: ReactNode
}

const b = 'rost-empty-state'

/**
 * What a screen says when there's nothing on it yet: a drawing, why, what to
 * do, and the button. Built from contracts/empty-state.contract.yaml.
 */
export function EmptyState({ illustration, title, action, as: H = 'h2', children, className, ...rest }: EmptyStateProps) {
  return (
    <div className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {illustration != null && <span className={`${b}__illustration`} aria-hidden="true">{illustration}</span>}
      <H className={`${b}__title`}>{title}</H>
      {children != null && <p className={`${b}__body`}>{children}</p>}
      {action != null && <span className={`${b}__action`}>{action}</span>}
    </div>
  )
}
