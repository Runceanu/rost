import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from '../badge/Badge'
import './toast.css'

export type ToastTone = 'default' | 'positive' | 'warning' | 'negative'

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly tone?: ToastTone
  /** What happened, in one short line. */
  readonly children: ReactNode
  /** One Borderless Button, like Undo. */
  readonly action?: ReactNode
}

const b = 'rost-toast'

/**
 * A short message that something happened, with one thing to do about it.
 * Read out by screen readers when it appears: at once when it's negative.
 * The app decides where it sits and how long it stays. Built from
 * contracts/toast.contract.yaml.
 */
export function Toast({ tone = 'default', children, action, className, ...rest }: ToastProps) {
  return (
    <div role={tone === 'negative' ? 'alert' : 'status'} className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      <Badge className={`${b}__badge`} status={tone} size="small" />
      <span className={`${b}__message`}>{children}</span>
      {action != null && <span className={`${b}__action`}>{action}</span>}
    </div>
  )
}
