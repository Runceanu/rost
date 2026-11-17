import type { HTMLAttributes } from 'react'
import './sparkline.css'

export interface SparklineProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The values, oldest first. Two or more. */
  readonly data: readonly number[]
  /** Whether the way it's going is good. */
  readonly tone?: 'neutral' | 'positive' | 'negative'
  /** What it shows and where it ended, in words. */
  readonly label: string
  /** In px. The height is 32. */
  readonly width?: number
}

const b = 'rost-sparkline'
const H = 32
const PAD = 3

/** The points of a sparkline, in its own px: what the SVG and the Figma drawing both use. */
export function sparklinePoints(data: readonly number[], width: number): [number, number][] {
  const lo = Math.min(...data), hi = Math.max(...data)
  const step = data.length > 1 ? (width - PAD * 2) / (data.length - 1) : 0
  return data.map((v, i) => [PAD + i * step, hi === lo ? H / 2 : PAD + (1 - (v - lo) / (hi - lo)) * (H - PAD * 2)])
}

/**
 * Which way something has been going, as a small line with a dot at now.
 * Built from contracts/sparkline.contract.yaml.
 */
export function Sparkline({ data, tone = 'neutral', label, width = 120, className, style, ...rest }: SparklineProps) {
  const pts = sparklinePoints(data, width)
  const [x, y] = pts[pts.length - 1] ?? [0, 0]
  return (
    <span role="img" aria-label={label} className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')} style={{ width, ...style }} {...rest}>
      <svg className={`${b}__svg`} width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
        <polyline className={`${b}__line`} points={pts.map((p) => p.join(',')).join(' ')} />
        <circle className={`${b}__dot`} cx={x} cy={y} r={3} />
      </svg>
    </span>
  )
}
