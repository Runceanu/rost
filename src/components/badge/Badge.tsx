import type { ReactNode } from 'react'
import './badge.css'
import dotDefault from './dot-default.svg'
import dotNegative from './dot-negative.svg'
import dotPositive from './dot-positive.svg'
import dotWarning from './dot-warning.svg'
import iconDot from './icon-dot.svg'

export type BadgeStatus = 'default' | 'negative' | 'positive' | 'warning'
export type BadgeSize = 'small' | 'medium'

export interface BadgeProps {
  readonly status?: BadgeStatus
  readonly size?: BadgeSize
  /** Medium only: the dot in front of the label. Off by default, as in Figma. */
  readonly showIcon?: boolean
  /** Replaces that dot. */
  readonly icon?: ReactNode
  /** Medium only. Small has no text, so give it an aria-label instead. */
  readonly children?: ReactNode
  readonly 'aria-label'?: string
}

// Small is just the coloured dot, one picture per status, exactly as Figma exports it.
const DOT: Record<BadgeStatus, string> = { default: dotDefault, negative: dotNegative, positive: dotPositive, warning: dotWarning }

const b = 'rost-badge'

/**
 * A status marker. Small is the dot on its own, Medium an outlined label.
 * Built from contracts/badge.contract.yaml, following the Figma layers.
 */
export function Badge({ status = 'default', size = 'medium', showIcon = false, icon, children, 'aria-label': ariaLabel }: BadgeProps) {
  const cls = `${b} ${b}--status-${status} ${b}--size-${size}`
  if (size === 'small') {
    return (
      <span className={cls} role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel}>
        <img src={DOT[status]} alt="" />
      </span>
    )
  }
  return (
    <span className={cls}>
      {showIcon && (
        <span className={`${b}__icon`} aria-hidden="true">
          {icon ?? (
            <span className={`${b}__icons-dot`}>
              <img src={iconDot} alt="" />
            </span>
          )}
        </span>
      )}
      <span className={`${b}__label`}>{children}</span>
      <span className={`${b}__outline`} />
    </span>
  )
}
