import type { HTMLAttributes } from 'react'
import './progress-ring.css'

export interface ProgressRingProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** From 0 to `max`. */
  readonly value: number
  readonly max?: number
  readonly tone?: 'positive' | 'warning' | 'negative'
  /** What it measures. The ring's name for screen readers. */
  readonly label: string
}

const b = 'rost-progress-ring'

/**
 * Progress as a 40px ring. A `role="progressbar"` with its values set.
 * Built from contracts/progress-ring.contract.yaml.
 */
export function ProgressRing({ value, max = 100, tone = 'positive', label, className, ...rest }: ProgressRingProps) {
  const share = Math.min(Math.max(value / (max || 1), 0), 1)
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <svg className={`${b}__svg`} viewBox="0 0 40 40" aria-hidden="true">
        <circle className={`${b}__track`} cx="20" cy="20" r="18" />
        <circle className={`${b}__arc`} cx="20" cy="20" r="18" pathLength={100} strokeDasharray={`${share * 100} 100`} />
      </svg>
    </span>
  )
}
