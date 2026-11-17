import type { OlHTMLAttributes } from 'react'
import './bar-chart.css'

export interface Bar {
  readonly label: string
  readonly value: number
  /** What a screen reader says for the value, like "€1,200". */
  readonly valueText?: string
}

export interface BarChartProps extends Omit<OlHTMLAttributes<HTMLOListElement>, 'children'> {
  /** The bars, in order. */
  readonly data: readonly Bar[]
  /** Which bar is now, by its place from 0. */
  readonly current?: number
  /** The value of a full-height bar. The largest value by default. */
  readonly max?: number
  /** The chart's height in px, labels included. */
  readonly height?: number
  /** What the chart shows. */
  readonly label: string
}

const b = 'rost-bar-chart'
const hidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as const

/**
 * A few figures as bars, with the current one in green. No axis, on
 * purpose. Built from contracts/bar-chart.contract.yaml.
 */
export function BarChart({ data, current, max, height = 160, label, className, style, ...rest }: BarChartProps) {
  const top = max ?? Math.max(...data.map((d) => d.value), 0)
  return (
    <ol aria-label={label} className={[b, className].filter(Boolean).join(' ')} style={{ height, ...style }} {...rest}>
      {data.map((d, i) => {
        const now = i === current
        const share = top > 0 ? Math.min(Math.max(d.value / top, 0), 1) : 0
        return (
          <li key={i} className={`${b}__item`} aria-current={now ? 'true' : undefined}>
            <span className={`${b}__plot`} aria-hidden="true">
              <span className={`${b}__${now ? 'current-bar' : 'bar'}`} style={{ height: `${share * 100}%` }} />
            </span>
            <span className={`${b}__${now ? 'current-label' : 'label'}`}>
              {d.label}<span style={hidden}>: {d.valueText ?? d.value}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
