import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './menu-item.css'

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `negative` for an action that loses something, like Delete. */
  readonly tone?: 'default' | 'negative'
  /** An Icon before the words. */
  readonly icon?: ReactNode
  readonly children: ReactNode
}

const b = 'rost-menu-item'

/** One action in a DropdownMenu. Built from contracts/menu-item.contract.yaml. */
export function MenuItem({ tone = 'default', icon, disabled, children, className, onClick, ...rest }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')}
      aria-disabled={disabled || undefined}
      onClick={(e) => { if (!disabled) onClick?.(e) }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
