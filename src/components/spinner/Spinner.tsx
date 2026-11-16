import type { HTMLAttributes } from 'react'
import './spinner.css'

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly size?: 'small' | 'medium'
  /** What's working, for screen readers. */
  readonly label?: string
}

const b = 'rost-spinner'

/**
 * Something is working and you can't tell how long it'll take: a grey ring
 * with a green quarter that turns. Built from contracts/spinner.contract.yaml.
 */
export function Spinner({ size = 'medium', label = 'Loading', className, ...rest }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={[b, `${b}--size-${size}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__track`} aria-hidden="true" />
      <span className={`${b}__arc`} aria-hidden="true" />
    </span>
  )
}
