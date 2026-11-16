import type { HTMLAttributes } from 'react'
import './progress.css'

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** From 0 to `max`. */
  readonly value: number
  readonly max?: number
  readonly tone?: 'positive' | 'warning' | 'negative'
  /** What's progressing. It's the bar's name for screen readers. */
  readonly label: string
}

const b = 'rost-progress'

/**
 * How far along something is, as a thin bar that fills. A
 * `role="progressbar"` with its values set. Built from
 * contracts/progress.contract.yaml.
 */
export function Progress({ value, max = 100, tone = 'positive', label, className, ...rest }: ProgressProps) {
  const share = Math.min(Math.max(value / (max || 1), 0), 1)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className={`${b}__fill`} style={{ width: `${share * 100}%` }} />
    </div>
  )
}
