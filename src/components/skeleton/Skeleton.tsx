import type { CSSProperties, HTMLAttributes } from 'react'
import './skeleton.css'

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly shape?: 'text' | 'circle' | 'block'
  /** Any CSS width, so lines can be uneven like real text. */
  readonly width?: string
  /** A block's height. */
  readonly height?: string
}

const b = 'rost-skeleton'

/**
 * A grey shape where content is about to be. Hidden from screen readers: put
 * `aria-busy` on whatever holds it. Built from contracts/skeleton.contract.yaml.
 */
export function Skeleton({ shape = 'text', width, height, className, style, ...rest }: SkeletonProps) {
  const size: CSSProperties = shape === 'circle' ? {} : { ...(width ? { width } : {}), ...(shape === 'block' && height ? { height } : {}) }
  return <span className={[b, `${b}--shape-${shape}`, className].filter(Boolean).join(' ')} aria-hidden="true" style={{ ...size, ...style }} {...rest} />
}
