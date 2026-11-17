import type { HTMLAttributes, ReactNode } from 'react'
import './figure.css'

export interface FigureProps extends HTMLAttributes<HTMLElement> {
  /** The picture, chart or drawing. */
  readonly children: ReactNode
  /** One or two lines on what it shows. */
  readonly caption?: ReactNode
}

const b = 'rost-figure'

/** Media with a line about it underneath. Built from contracts/figure.contract.yaml. */
export function Figure({ children, caption, className, ...rest }: FigureProps) {
  return (
    <figure className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <div className={`${b}__media`}>{children}</div>
      {caption != null && <figcaption className={`${b}__caption`}>{caption}</figcaption>}
    </figure>
  )
}
