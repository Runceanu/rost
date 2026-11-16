import type { HTMLAttributes, ReactNode } from 'react'
import './stat.css'

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  /** What the figure is. */
  readonly label: ReactNode
  /** The figure, formatted. */
  readonly value: ReactNode
  /** How it moved, in words. */
  readonly delta?: ReactNode
  /** The delta's colour: good news is positive, whichever way the number went. */
  readonly tone?: 'positive' | 'negative' | 'neutral'
}

const b = 'rost-stat'

/** One figure that matters. Built from contracts/stat.contract.yaml. */
export function Stat({ label, value, delta, tone = 'neutral', className, ...rest }: StatProps) {
  return (
    <div className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__label`}>{label}</span>
      <span className={`${b}__value`}>{value}</span>
      {delta != null && <span className={`${b}__delta`}>{delta}</span>}
    </div>
  )
}
