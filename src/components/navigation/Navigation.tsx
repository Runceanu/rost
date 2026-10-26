import type { HTMLAttributes, ReactNode } from 'react'
import './navigation.css'

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  /** Icons only, 72px wide. Open, it's 160px with labels. */
  readonly collapsed?: boolean
  /** The mark at the top, 40px. */
  readonly logo?: ReactNode
  /** One action at the bottom: an IconButton when collapsed, a Button when open. */
  readonly action?: ReactNode
  /** The items: ListItems, icon only when collapsed. */
  readonly children?: ReactNode
  /** Say what it is: "Main". */
  readonly 'aria-label': string
}

const b = 'rost-navigation'

/**
 * A side navigation on frosted glass: the logo, the items, one action.
 * Built from contracts/navigation.contract.yaml.
 */
export function Navigation({ collapsed = false, logo, action, children, className, ...rest }: NavigationProps) {
  return (
    <nav className={[b, collapsed && `${b}--collapsed`, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__background`} />
      {logo && <span className={`${b}__logo`}>{logo}</span>}
      <div className={`${b}__main`}>{children}</div>
      {action && <div className={`${b}__action`}>{action}</div>}
    </nav>
  )
}
