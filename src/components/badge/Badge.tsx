import type { HTMLAttributes, ReactNode } from 'react'
import './badge.css'

export type BadgeStatus = 'default' | 'negative' | 'positive' | 'warning'
export type BadgeSize = 'small' | 'medium'

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly status?: BadgeStatus
  readonly size?: BadgeSize
  /** Medium only: the dot in front of the label. Off by default, as in Figma. */
  readonly showIcon?: boolean
  /** Replaces that dot when `showIcon` is on. */
  readonly icon?: ReactNode
  /** The label. Medium only: Small has no text, so give it an `aria-label`. */
  readonly children?: ReactNode
}

const b = 'rost-badge'

/**
 * A status marker. Small is the dot on its own, Medium an outlined label.
 * Built from contracts/badge.contract.yaml, following the Figma layers.
 * Prop values are the contract's, lower case: `Negative` is `status="negative"`.
 */
export function Badge({ status = 'default', size = 'medium', showIcon = false, icon, children, className, 'aria-label': ariaLabel, ...rest }: BadgeProps) {
  const cls = [b, `${b}--status-${status}`, `${b}--size-${size}`, className].filter(Boolean).join(' ')
  if (size === 'small') {
    // The dot is the whole badge, so the label names it. It's a mask in the status colour.
    return (
      <span className={cls} {...rest}>
        <span className={`${b}__dot`} {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : { 'aria-hidden': true })} />
      </span>
    )
  }
  return (
    <span className={cls} aria-label={ariaLabel} {...rest}>
      {showIcon && (
        <span className={`${b}__icon`} aria-hidden="true">
          {icon ?? (
            <span className={`${b}__icons-dot`} />
          )}
        </span>
      )}
      <span className={`${b}__label`}>{children}</span>
      <span className={`${b}__outline`} />
    </span>
  )
}
