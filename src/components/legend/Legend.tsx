import type { HTMLAttributes, ReactNode } from 'react'
import './legend.css'

export interface LegendItem {
  readonly label: ReactNode
  readonly value?: ReactNode
  /** The green one, as in BarChart. */
  readonly current?: boolean
}

export interface LegendProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  /** One per colour, in the order the chart uses them. */
  readonly items: readonly LegendItem[]
}

const b = 'rost-legend'

/** What a chart's colours mean. Built from contracts/legend.contract.yaml. */
export function Legend({ items, className, ...rest }: LegendProps) {
  return (
    <ul className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {items.map((it, i) => (
        <li key={i} className={`${b}__item`}>
          <span className={`${b}__${it.current ? 'current-swatch' : 'swatch'}`} aria-hidden="true" />
          <span className={`${b}__label`}>{it.label}</span>
          {it.value != null && <span className={`${b}__value`}>{it.value}</span>}
        </li>
      ))}
    </ul>
  )
}
