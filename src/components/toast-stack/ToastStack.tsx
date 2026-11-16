import type { HTMLAttributes, ReactNode } from 'react'
import './toast-stack.css'

export interface ToastStackProps extends HTMLAttributes<HTMLDivElement> {
  /** `bottom` floats over the page; `inline` stays where it's put. */
  readonly placement?: 'bottom' | 'inline'
  /** The Toasts, oldest first. */
  readonly children?: ReactNode
}

const b = 'rost-toast-stack'

/**
 * Where toasts go when there's more than one: a column, newest at the
 * bottom. It only lays them out; which ones show and for how long is the
 * app's. Built from contracts/toast-stack.contract.yaml.
 */
export function ToastStack({ placement = 'bottom', children, className, ...rest }: ToastStackProps) {
  return <div role="region" aria-label="Notifications" className={[b, `${b}--placement-${placement}`, className].filter(Boolean).join(' ')} {...rest}>{children}</div>
}
